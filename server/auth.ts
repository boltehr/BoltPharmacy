import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { insertUserSchema } from "@shared/schema";
import { compare, hash } from "bcrypt";
import { z } from "zod";
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Custom validation schema for user registration
const registerSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address")
    .refine(email => email.includes("@") && email.includes("."), {
      message: "Please enter a valid email address with domain (e.g., name@example.com)"
    }),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .refine(password => /[A-Z]/.test(password), {
      message: "Password must contain at least one uppercase letter"
    })
    .refine(password => /[a-z]/.test(password), {
      message: "Password must contain at least one lowercase letter"
    })
    .refine(password => /[0-9]/.test(password), {
      message: "Password must contain at least one number"
    })
    .refine(password => /[^A-Za-z0-9]/.test(password), {
      message: "Password must contain at least one special character"
    }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  dateOfBirth: z.string().optional(),
  sexAtBirth: z.string().optional(),
});

// For TypeScript to understand session user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Helper to hash passwords 
export async function hashPassword(password: string): Promise<string> {
  console.log('Hashing password with bcrypt');
  try {
    const hashedPassword = await hash(password, 10);
    console.log(`Password hashed successfully, result starts with: ${hashedPassword.substring(0, 10)}...`);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
}

// Helper to compare passwords
async function comparePasswords(providedPassword: string, storedPassword: string): Promise<boolean> {
  console.log(`Comparing passwords - Provided: ${providedPassword.substring(0, 3)}***, Stored: ${storedPassword.substring(0, 10)}...`);
  
  try {
    // We're now using bcrypt for all password hashing
    if (storedPassword.startsWith('$2')) {
      // Using bcrypt
      console.log('Using bcrypt comparison');
      const result = await compare(providedPassword, storedPassword);
      console.log(`Password comparison with bcrypt result: ${result}`);
      return result;
    } else if (storedPassword.includes('.')) {
      // Legacy: Using our custom hash format (hash.salt)
      console.log('Using custom hash comparison');
      const [hashed, salt] = storedPassword.split(".");
      if (!hashed || !salt) {
        console.error('Invalid stored password format');
        return false;
      }
      
      try {
        const hashedBuf = Buffer.from(hashed, "hex");
        const suppliedBuf = (await scryptAsync(providedPassword, salt, 64)) as Buffer;
        return timingSafeEqual(hashedBuf, suppliedBuf);
      } catch (err) {
        console.error('Error in timingSafeEqual:', err);
        // Fallback to regular comparison if buffer lengths don't match
        const suppliedHash = (await scryptAsync(providedPassword, salt, 64)).toString('hex');
        return suppliedHash === hashed;
      }
    } else {
      // For development/testing or un-hashed passwords
      console.log('Password does not appear to be hashed properly, using direct comparison');
      return providedPassword === storedPassword;
    }
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

// Middleware to check if a user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}

// Middleware to check if user is an admin
export async function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Check if user has admin role
    if (user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: "Admin access required" });
    }
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({ message: "Server error during admin check" });
  }
}

// Middleware to check if user is a pharmacist
export async function isPharmacist(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Check if user has pharmacist role (or admin, who can also perform pharmacist actions)
    if (user.role === 'pharmacist' || user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: "Pharmacist access required" });
    }
  } catch (error) {
    console.error("Pharmacist check error:", error);
    res.status(500).json({ message: "Server error during pharmacist check" });
  }
}

// Middleware to check if user is a call center operator
export async function isCallCenter(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Check if user has call_center role (or admin, who can perform all actions)
    if (user.role === 'call_center' || user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: "Call center access required" });
    }
  } catch (error) {
    console.error("Call center check error:", error);
    res.status(500).json({ message: "Server error during call center check" });
  }
}

// Middleware to check if user is staff (admin, pharmacist, or call center)
export async function isStaff(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    // Check if user has any staff role
    if (user.role === 'admin' || user.role === 'pharmacist' || user.role === 'call_center') {
      next();
    } else {
      res.status(403).json({ message: "Staff access required" });
    }
  } catch (error) {
    console.error("Staff check error:", error);
    res.status(500).json({ message: "Server error during staff check" });
  }
}

// Route to register a new user
export async function register(req: Request, res: Response) {
  try {
    // Validate request data with enhanced schema
    try {
      registerSchema.parse(req.body);
    } catch (err: any) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }

    // Check if email exists
    const existingUser = await storage.getUserByEmail(req.body.email);
    if (existingUser) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    // Email validation with regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    // Hash the password
    const hashedPassword = await hashPassword(req.body.password);

    // Generate a username from email if not provided
    let username = req.body.username;
    if (!username) {
      username = req.body.email.split('@')[0];
      // Check if this username exists
      const userWithUsername = await storage.getUserByUsername(username);
      if (userWithUsername) {
        // Add random numbers to make it unique
        username = `${username}${Math.floor(Math.random() * 10000)}`;
      }
    }

    // Create the user with the hashed password
    const user = await storage.createUser({
      ...req.body,
      username,
      password: hashedPassword,
    });

    // Set the user ID in the session
    req.session.userId = user.id;
    
    // Exclude password from the response
    const { password, ...userWithoutPassword } = user;
    
    res.status(201).json(userWithoutPassword);
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Failed to register user" });
  }
}

// Route to log in a user
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    console.log(`Login attempt for email: ${email}`);
    
    // Find the user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      console.log(`User not found with email: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    console.log(`User found: ${user.username}, role: ${user.role}, stored password: ${user.password?.substring(0, 10)}...`);

    // Check the password
    const isPasswordValid = await comparePasswords(password, user.password);
    console.log(`Password comparison result: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Set the user ID in the session
    req.session.userId = user.id;
    
    // Exclude password from the response
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json(userWithoutPassword);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Failed to log in" });
  }
}

// Route to log out a user
export async function logout(req: Request, res: Response) {
  try {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ message: "Failed to log out" });
  }
}

// Route to get the current user
export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }

    // Exclude password from the response
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json(userWithoutPassword);
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(500).json({ message: "Failed to get current user" });
  }
}

// Route to handle forgot password requests
export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    // Email validation with regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }
    
    // Find the user by email
    const user = await storage.getUserByEmail(email);
    
    // Important security note: we always return a success message even if the email doesn't exist
    // This prevents user enumeration attacks
    
    if (user) {
      // Generate a unique token that expires in 1 hour
      const resetToken = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
      
      // Store the token in the database
      await storage.storePasswordResetToken(user.id, resetToken, resetTokenExpiry);
      
      // In a real implementation, send an email with a link to reset password
      // For this demo, we'll just log it to the console
      console.log(`[DEMO] Password reset link for ${email}: /reset-password?token=${resetToken}`);
      
      // TODO: Send actual email notification with SendGrid
      // This would be implemented once we have the SendGrid API key
    }
    
    // Always return a success message, regardless of whether user exists
    res.status(200).json({ 
      message: "If the email exists in our system, password reset instructions will be sent to it."
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Failed to process forgot password request" });
  }
}

// Reset password using token
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }
    
    // Validate the new password
    try {
      registerSchema.pick({ password: true }).parse({ password: newPassword });
    } catch (err: any) {
      const validationError = fromZodError(err);
      return res.status(400).json({ 
        message: "Password validation failed", 
        errors: validationError.details 
      });
    }
    
    // Find user by reset token
    const user = await storage.getUserByResetToken(token);
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the user's password and remove the reset token
    const success = await storage.resetPassword(user.id, hashedPassword);
    
    if (!success) {
      return res.status(500).json({ message: "Failed to reset password" });
    }
    
    // Return success message
    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Failed to reset password" });
  }
}

// Function to initialize or reset the admin user
export async function initializeAdminUser() {
  try {
    const adminUser = {
      email: 'admin@example.com',
      username: 'admin',
      password: 'Admin123!',
      firstName: 'Admin',
      lastName: 'User',
      phone: '555-987-6543',
      address: '456 Admin St, Admintown, USA',
      dateOfBirth: '1985-05-05',
      sexAtBirth: 'female',
      role: 'admin'
    };
    
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByEmail(adminUser.email);
    
    if (existingAdmin) {
      console.log('Admin user exists, resetting password:', existingAdmin.id);
      const hashedPassword = await hashPassword(adminUser.password);
      await storage.resetPassword(existingAdmin.id, hashedPassword);
      console.log('Admin password reset with newly hashed password');
      return { message: 'Admin user password reset', id: existingAdmin.id };
    } else {
      // Create new admin user with hashed password
      const hashedPassword = await hashPassword(adminUser.password);
      const newAdmin = await storage.createUser({
        ...adminUser,
        password: hashedPassword
      });
      console.log('New admin user created:', newAdmin.id);
      return { message: 'Admin user created', id: newAdmin.id };
    }
  } catch (error) {
    console.error('Failed to initialize admin user:', error);
    throw error;
  }
}

export function setupAuth(app: Express) {
  // The admin initialization route is set up below
  // Set up session middleware to load user data
  app.use(async (req: Request, _res: Response, next: NextFunction) => {
    if (req.session && req.session.userId) {
      // Load full user object from database instead of just setting the ID
      try {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          // Remove password before adding to request
          const { password, ...userWithoutPassword } = user;
          req.user = userWithoutPassword as User;
          console.log(`Session middleware - Loaded user ${user.id}, profile complete: ${user.profileCompleted}`);
        } else {
          console.log(`Session middleware - User ${req.session.userId} not found`);
          req.user = { id: req.session.userId } as User;
        }
      } catch (error) {
        console.error(`Session middleware - Error loading user: ${error}`);
        req.user = { id: req.session.userId } as User;
      }
    }
    next();
  });

  // Register authentication routes
  app.post("/api/register", register);
  app.post("/api/login", login);
  app.post("/api/logout", logout);
  app.get("/api/user", getCurrentUser);
  app.post("/api/forgot-password", forgotPassword);
  app.post("/api/reset-password", resetPassword);
  
  // Admin user initialization/reset route
  app.get("/api/reinitialize-admin-user", async (_req, res) => {
    try {
      const result = await initializeAdminUser();
      res.json(result);
    } catch (error) {
      console.error('Admin initialization API error:', error);
      res.status(500).json({ error: 'Failed to reinitialize admin user' });
    }
  });
  
  // Endpoint to reinitialize all users
  app.get("/api/reinitialize-all-users", async (_req, res) => {
    try {
      // Reinitialize the database (will recreate both test and admin users)
      await import('./init-db').then(module => module.initializeDatabase());
      res.json({ message: 'All users reinitialized successfully' });
    } catch (error) {
      console.error('User reinitialization error:', error);
      res.status(500).json({ error: 'Failed to reinitialize users' });
    }
  });
}