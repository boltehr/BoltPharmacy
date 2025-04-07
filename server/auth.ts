import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { insertUserSchema } from "@shared/schema";
import { compare, hash } from "bcrypt";

// For TypeScript to understand session user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Helper to hash passwords 
async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

// Helper to compare passwords
async function comparePasswords(providedPassword: string, storedPassword: string): Promise<boolean> {
  return compare(providedPassword, storedPassword);
}

// Middleware to check if a user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}

// Route to register a new user
export async function register(req: Request, res: Response) {
  try {
    try {
      insertUserSchema.parse(req.body);
    } catch (err: any) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(req.body.email);
    if (existingUser) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    // Hash the password
    const hashedPassword = await hashPassword(req.body.password);

    // Create the user with the hashed password
    const user = await storage.createUser({
      ...req.body,
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

    // Find the user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check the password
    const isPasswordValid = await comparePasswords(password, user.password);
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

// Function to set up authentication routes
export function setupAuth(app: Express) {
  // Set up session middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.session && req.session.userId) {
      req.user = { id: req.session.userId } as User;
    }
    next();
  });

  // Register authentication routes
  app.post("/api/register", register);
  app.post("/api/login", login);
  app.post("/api/logout", logout);
  app.get("/api/user", getCurrentUser);
}