import express, { type Request, Response } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { ZodError } from "zod";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin, hashPassword, initializeAdminUser } from './auth';
import { shippingService, type ShippingAddress, type PackageDetails } from './services/shipping';
import { parseWebsiteTheme } from './services/websiteParser';
import { 
  insertUserSchema, 
  insertMedicationSchema,
  insertCategorySchema,
  insertPrescriptionSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertInsuranceSchema,
  insertInsuranceProviderSchema,
  insertRefillRequestSchema,
  insertRefillNotificationSchema,
  insertWhiteLabelSchema,
  insertInventoryProviderSchema,
  insertInventoryItemSchema,
  insertInventoryMappingSchema,
  type CartItem
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();
  
  // Middleware to handle validation errors
  const validateRequest = (schema: any) => (req: Request, res: Response, next: Function) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err: any) {
      const validationError = fromZodError(err);
      res.status(400).json({ message: validationError.message });
    }
  };
  
  // Setup authentication routes (/api/register, /api/login, /api/logout, /api/user)
  // These routes are defined in auth.ts
  setupAuth(app);
  
  // Debugging endpoint to get all users (TEMPORARY)
  app.get('/api/debug-users', async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't expose password hashes
      const safeUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }));
      res.json(safeUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Legacy User routes - consider migrating to auth.ts
  router.post("/users", validateRequest(insertUserSchema), async (req, res) => {
    try {
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }
      
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (err) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  // Get all users (admin only)
  router.get("/users", isAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  // Update user role (admin only)
  router.patch("/users/:id/role", isAdmin, async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { role } = req.body;
      
      // Validate role
      if (!role || !['user', 'call_center', 'pharmacist', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be one of: user, call_center, pharmacist, admin" });
      }
      
      // Get user to check if exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user role
      const updated = await storage.updateUserRole(userId, role);
      if (!updated) {
        return res.status(500).json({ message: "Failed to update user role" });
      }
      
      res.status(200).json({ message: "User role updated successfully", userId, role });
    } catch (err) {
      console.error("Error updating user role:", err);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  
  // Delete user by email (admin only)
  router.delete("/users/email/:email", isAdmin, async (req, res) => {
    try {
      const { email } = req.params;
      
      // First find the user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Delete the user
      const deleted = await storage.deleteUser(user.id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete user" });
      }
      
      res.status(200).json({ message: `User ${email} deleted successfully` });
    } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  router.get("/users/:id", async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });
  
  router.put("/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = Number(req.params.id);
      console.log(`Updating user profile for ID: ${userId}`);
      console.log(`Session user ID: ${req.session.userId}, Request user ID: ${req.user?.id}`);
      
      // Check if the authenticated user is updating their own profile
      if (req.user?.id !== userId) {
        console.log("Forbidden: User trying to update someone else's profile");
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      // Filter out sensitive fields that shouldn't be updated directly
      const { password, ...updateData } = req.body;
      console.log("Profile update data:", JSON.stringify(updateData));
      
      // Perform the update
      const user = await storage.updateUser(userId, updateData);
      if (!user) {
        console.log(`User not found with ID: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`Updated user successfully:`, JSON.stringify({
        id: user.id,
        email: user.email,
        profileCompleted: user.profileCompleted
      }));
      
      // Update session user data
      if (req.user) {
        console.log("Updating user in session");
        Object.assign(req.user, user);
      }
      
      res.json(user);
    } catch (err) {
      console.error("Error updating user profile:", err);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });
  

  
  // Medication routes
  router.get("/medications", async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const medications = await storage.getMedications(limit, offset);
    res.json(medications);
  });
  
  router.get("/medications/search", async (req, res) => {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }
    
    const medications = await storage.searchMedications(query);
    res.json(medications);
  });
  
  router.get("/medications/popular", async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 4;
    const medications = await storage.getPopularMedications(limit);
    res.json(medications);
  });
  
  router.get("/medications/category/:category", async (req, res) => {
    const medications = await storage.getMedicationsByCategory(req.params.category);
    res.json(medications);
  });
  
  router.get("/medications/:id", async (req, res) => {
    const medication = await storage.getMedication(Number(req.params.id));
    if (!medication) {
      return res.status(404).json({ message: "Medication not found" });
    }
    res.json(medication);
  });
  
  router.post("/medications", isAdmin, validateRequest(insertMedicationSchema), async (req, res) => {
    try {
      const medication = await storage.createMedication(req.body);
      res.status(201).json(medication);
    } catch (err) {
      console.error("Error creating medication:", err);
      res.status(500).json({ message: "Failed to create medication" });
    }
  });
  
  // Update an existing medication (admin only)
  router.put("/medications/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const medication = await storage.getMedication(id);
      
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      
      // Validate the request body
      const parseResult = insertMedicationSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid medication data", 
          errors: parseResult.error.errors 
        });
      }
      
      const updatedMedication = await storage.updateMedication(id, parseResult.data);
      res.json(updatedMedication);
    } catch (err) {
      console.error("Error updating medication:", err);
      res.status(500).json({ message: "Failed to update medication" });
    }
  });
  
  // Delete a medication (admin only)
  router.delete("/medications/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const medication = await storage.getMedication(id);
      
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      
      // In a real application, you might want to check if the medication is used in any orders
      // before deleting it or implement a soft delete instead
      
      // For now, we'll just update the medication to mark it as deleted (soft delete)
      await storage.updateMedication(id, { inStock: false });
      
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting medication:", err);
      res.status(500).json({ message: "Failed to delete medication" });
    }
  });
  
  // Category routes
  router.get("/categories", async (_req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });
  
  router.get("/categories/:id", async (req, res) => {
    const category = await storage.getCategory(Number(req.params.id));
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  });
  
  router.post("/categories", isAdmin, validateRequest(insertCategorySchema), async (req, res) => {
    try {
      // Check if category with the same name already exists
      const existingCategory = await storage.getCategoryByName(req.body.name);
      if (existingCategory) {
        return res.status(409).json({ message: 'A category with this name already exists' });
      }
      
      const category = await storage.createCategory(req.body);
      res.status(201).json(category);
    } catch (err) {
      console.error("Error creating category:", err);
      res.status(500).json({ message: "Failed to create category" });
    }
  });
  
  // Update an existing category (admin only)
  router.put("/categories/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Validate the request body
      const parseResult = insertCategorySchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid category data", 
          errors: parseResult.error.errors 
        });
      }
      
      // If name is being updated, check for conflicts
      if (parseResult.data.name && parseResult.data.name !== category.name) {
        const existingCategory = await storage.getCategoryByName(parseResult.data.name);
        if (existingCategory && existingCategory.id !== id) {
          return res.status(409).json({ message: 'A category with this name already exists' });
        }
      }
      
      const updatedCategory = await storage.updateCategory(id, parseResult.data);
      res.json(updatedCategory);
    } catch (err) {
      console.error("Error updating category:", err);
      res.status(500).json({ message: "Failed to update category" });
    }
  });
  
  // Prescription routes
  router.get("/prescriptions/user/:userId", async (req, res) => {
    const prescriptions = await storage.getPrescriptionsByUser(Number(req.params.userId));
    res.json(prescriptions);
  });
  
  // Get all prescriptions for verification (admin only)
  router.get("/prescriptions/verification/queue", isAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const offset = req.query.offset ? Number(req.query.offset) : 0;
      
      const prescriptions = await storage.getPrescriptionsForVerification(status, limit, offset);
      
      // Get associated user data for each prescription
      const prescriptionsWithUsers = await Promise.all(
        prescriptions.map(async (prescription) => {
          const user = await storage.getUser(prescription.userId);
          return {
            ...prescription,
            user: user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone
            } : null
          };
        })
      );
      
      res.json(prescriptionsWithUsers);
    } catch (error) {
      console.error("Error fetching verification queue:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get all prescriptions with search capabilities (admin only)
  router.get("/prescriptions/admin", isAdmin, async (req, res) => {
    try {
      const searchQuery = req.query.search as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const offset = req.query.offset ? Number(req.query.offset) : 0;
      
      // Get prescriptions from storage - we'll use getPrescriptionsForVerification since it gets all prescriptions
      const prescriptions = await storage.getPrescriptionsForVerification(undefined, limit, offset);
      
      // Get associated user data for each prescription
      let prescriptionsWithUsers = await Promise.all(
        prescriptions.map(async (prescription) => {
          const user = await storage.getUser(prescription.userId);
          return {
            ...prescription,
            user: user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone
            } : null
          };
        })
      );
      
      // Filter by search query if provided
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        prescriptionsWithUsers = prescriptionsWithUsers.filter(p => 
          (p.user?.firstName && p.user.firstName.toLowerCase().includes(query)) ||
          (p.user?.lastName && p.user.lastName.toLowerCase().includes(query)) ||
          (p.user?.email && p.user.email.toLowerCase().includes(query)) ||
          (p.user?.phone && p.user.phone.toLowerCase().includes(query)) ||
          (p.doctorName && p.doctorName.toLowerCase().includes(query))
        );
      }
      
      res.json({
        prescriptions: prescriptionsWithUsers,
        total: prescriptionsWithUsers.length,
        limit,
        offset
      });
    } catch (error) {
      console.error("Error fetching admin prescriptions:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  router.get("/prescriptions/:id", async (req, res) => {
    const prescription = await storage.getPrescription(Number(req.params.id));
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }
    res.json(prescription);
  });
  
  // Get all orders for a specific prescription
  router.get("/prescriptions/:id/orders", async (req, res) => {
    try {
      const prescriptionId = Number(req.params.id);
      
      // Verify the prescription exists
      const prescription = await storage.getPrescription(prescriptionId);
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      // Get all orders associated with this prescription
      const orders = await storage.getOrdersByPrescription(prescriptionId);
      
      // Return orders sorted by date (newest first)
      const sortedOrders = orders.sort((a, b) => {
        const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
        const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
        return dateB - dateA;
      });
      
      res.json(sortedOrders);
    } catch (error) {
      console.error("Error fetching prescription orders:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get orders by status (admin only)
  router.get("/orders/status/:status", isAdmin, async (req, res) => {
    try {
      const status = req.params.status;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const offset = req.query.offset ? Number(req.query.offset) : 0;
      
      // Get orders by status
      const { orders, total } = await storage.getOrdersByStatus(status, limit, offset);
      
      // Enhance orders with user and prescription information
      const enhancedOrders = await Promise.all(orders.map(async (order) => {
        const user = order.userId ? await storage.getUser(order.userId) : null;
        const prescription = order.prescriptionId ? await storage.getPrescription(order.prescriptionId) : null;
        const orderItems = await storage.getOrderItems(order.id);
        
        return {
          ...order,
          user: user ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone
          } : null,
          prescription: prescription ? {
            id: prescription.id,
            status: prescription.status,
            uploadDate: prescription.uploadDate,
            verifiedBy: prescription.verifiedBy,
            revoked: prescription.revoked
          } : null,
          items: orderItems
        };
      }));
      
      res.json({ 
        orders: enhancedOrders, 
        total,
        status,
        limit,
        offset
      });
    } catch (error) {
      console.error("Error fetching orders by status:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get all orders with search capabilities (admin only)
  // Get all orders with filtering capability by email, name, or phone number
  router.get("/orders/all", isAdmin, async (req, res) => {
    try {
      const searchTerm = req.query.search as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const offset = req.query.offset ? Number(req.query.offset) : 0;
      
      // Get all orders with optional search filter
      const { orders, total } = await storage.getAllOrders(limit, offset, searchTerm);
      
      // Enhance orders with user and prescription information
      let enhancedOrders = await Promise.all(orders.map(async (order) => {
        const user = order.userId ? await storage.getUser(order.userId) : null;
        const prescription = order.prescriptionId ? await storage.getPrescription(order.prescriptionId) : null;
        const orderItems = await storage.getOrderItems(order.id);
        
        return {
          ...order,
          user: user ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone
          } : null,
          prescription: prescription ? {
            id: prescription.id,
            status: prescription.status,
            uploadDate: prescription.uploadDate,
            prescriptionNumber: prescription.prescriptionNumber,
            doctorName: prescription.doctorName
          } : null,
          items: orderItems
        };
      }));
      
      // Apply search filter if not already applied at database level
      if (searchTerm && enhancedOrders.length > 0) {
        const lowercaseSearch = searchTerm.toLowerCase();
        // Note: in most implementations, search is already handled at database level,
        // but we have a second layer here to ensure comprehensive matching
      }
      
      res.json({
        orders: enhancedOrders,
        total
      });
    } catch (err) {
      console.error("Error fetching all orders:", err);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  router.get("/orders/admin", isAdmin, async (req, res) => {
    try {
      const searchQuery = req.query.search as string | undefined;
      const status = req.query.status as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 20;
      const offset = req.query.offset ? Number(req.query.offset) : 0;
      
      // Get orders by status, or all orders if no status specified
      const { orders, total } = await storage.getOrdersByStatus(status || 'all', limit, offset);
      
      // Enhance orders with user and prescription information
      let enhancedOrders = await Promise.all(orders.map(async (order) => {
        const user = order.userId ? await storage.getUser(order.userId) : null;
        const prescription = order.prescriptionId ? await storage.getPrescription(order.prescriptionId) : null;
        const orderItems = await storage.getOrderItems(order.id);
        
        return {
          ...order,
          user: user ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone
          } : null,
          prescription: prescription ? {
            id: prescription.id,
            status: prescription.status,
            uploadDate: prescription.uploadDate,
            verifiedBy: prescription.verifiedBy,
            // Compute verification status based on existing fields if not available
            verificationStatus: prescription.verificationStatus || 
              (prescription.verifiedBy ? "verified" : "unverified"),
            revoked: prescription.revoked
          } : null,
          items: orderItems
        };
      }));
      
      // Filter by search query if provided
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        enhancedOrders = enhancedOrders.filter(order => 
          (order.user?.firstName && order.user.firstName.toLowerCase().includes(query)) ||
          (order.user?.lastName && order.user.lastName.toLowerCase().includes(query)) ||
          (order.user?.email && order.user.email.toLowerCase().includes(query)) ||
          (order.user?.phone && order.user.phone.toLowerCase().includes(query)) ||
          (order.trackingNumber && order.trackingNumber.toLowerCase().includes(query))
        );
      }
      
      res.json({ 
        orders: enhancedOrders, 
        total: enhancedOrders.length,
        status,
        limit,
        offset
      });
    } catch (error) {
      console.error("Error fetching admin orders:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Verify a prescription (admin only)
  router.post("/prescriptions/:id/verify", isAdmin, async (req, res) => {
    try {
      const prescriptionId = Number(req.params.id);
      const verifierId = req.user?.id;
      
      if (!verifierId) {
        return res.status(401).json({ message: "Verification requires authentication" });
      }
      
      // Validate request body
      const { status, verificationMethod, verificationNotes, expirationDate } = req.body;
      
      if (!status || !verificationMethod) {
        return res.status(400).json({ 
          message: "Missing required fields: status and verificationMethod are required" 
        });
      }
      
      const prescription = await storage.verifyPrescription(prescriptionId, verifierId, {
        status,
        verificationMethod,
        verificationNotes,
        expirationDate: expirationDate ? new Date(expirationDate) : undefined
      });
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      res.json(prescription);
    } catch (error) {
      console.error("Error verifying prescription:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Revoke a prescription (admin only)
  router.post("/prescriptions/:id/revoke", isAdmin, async (req, res) => {
    try {
      const prescriptionId = Number(req.params.id);
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: "Revocation reason is required" });
      }
      
      const prescription = await storage.revokePrescription(prescriptionId, reason);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      res.json(prescription);
    } catch (error) {
      console.error("Error revoking prescription:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Generate a new security code for a prescription (admin only)
  router.post("/prescriptions/:id/security-code", isAdmin, async (req, res) => {
    try {
      const prescriptionId = Number(req.params.id);
      
      const securityCode = await storage.generateSecurityCode(prescriptionId);
      
      res.json({ securityCode });
    } catch (error) {
      console.error("Error generating security code:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  // Validate a prescription for a specific medication
  router.get("/prescriptions/:id/validate/:medicationId", async (req, res) => {
    try {
      const prescriptionId = Number(req.params.id);
      const medicationId = Number(req.params.medicationId);
      
      const result = await storage.validatePrescriptionForMedication(prescriptionId, medicationId);
      
      res.json(result);
    } catch (error) {
      console.error("Error validating prescription:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  router.post("/prescriptions", validateRequest(insertPrescriptionSchema), async (req, res) => {
    try {
      const prescription = await storage.createPrescription(req.body);
      res.status(201).json(prescription);
    } catch (err) {
      res.status(500).json({ message: "Failed to create prescription" });
    }
  });
  
  router.put("/prescriptions/:id", async (req, res) => {
    const prescription = await storage.updatePrescription(Number(req.params.id), req.body);
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }
    res.json(prescription);
  });
  
  // Order routes
  router.get("/orders/user/:userId", async (req, res) => {
    const orders = await storage.getOrdersByUser(Number(req.params.userId));
    res.json(orders);
  });
  
  router.get("/orders/:id", async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    const orderItems = await storage.getOrderItems(Number(req.params.id));
    
    // Get the associated prescription
    const prescription = order.prescriptionId ? 
      await storage.getPrescription(order.prescriptionId) : null;
    
    // Get other orders related to the same prescription
    const relatedOrders = prescription ? 
      await storage.getOrdersByPrescription(prescription.id) : [];
    
    // Filter out the current order from related orders
    const otherOrders = relatedOrders.filter((o: { id: number }) => o.id !== order.id);
    
    res.json({ 
      ...order, 
      items: orderItems,
      prescription,
      relatedOrders: otherOrders
    });
  });
  
  router.post("/orders", validateRequest(insertOrderSchema), async (req, res) => {
    try {
      // Create initial order with pending status
      const orderData = {
        ...req.body,
        status: 'pending' // Always set initial status to pending
      };
      
      let order = await storage.createOrder(orderData);
      
      // If order has a prescription, check if it's already verified
      if (order.prescriptionId) {
        const prescription = await storage.getPrescription(order.prescriptionId);
        
        if (prescription && prescription.status === 'approved' && !prescription.revoked) {
          console.log(`Prescription ${prescription.id} already verified - order can be processed`);
          
          // In a real application, this is where we would queue the order for pharmacist review
          // rather than auto-marking it as shipped
        } else {
          console.log(`Order ${order.id} requires prescription verification before shipping`);
        }
      } else if (req.body.requiresPrescription) {
        // Order contains prescription-required medications but no prescription attached
        console.log(`Order ${order.id} requires a prescription but none was provided`);
      }
      
      // Send notification email to user (mock implementation)
      const userEmail = req.user?.email;
      if (userEmail) {
        console.log(`Notification email would be sent to ${userEmail}: Your order #${order.id} has been received and is pending approval.`);
      }
      
      res.status(201).json(order);
    } catch (err) {
      res.status(500).json({ message: "Failed to create order" });
    }
  });
  
  router.put("/orders/:id", async (req, res) => {
    const order = await storage.updateOrder(Number(req.params.id), req.body);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  });
  
  // Admin endpoint to approve and ship an order
  router.post("/orders/:id/approve", isAdmin, async (req, res) => {
    try {
      const orderId = Number(req.params.id);
      
      // Get the order
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // If order has prescription, verify it's approved
      if (order.prescriptionId) {
        const prescription = await storage.getPrescription(order.prescriptionId);
        
        if (!prescription) {
          return res.status(400).json({ message: "Associated prescription not found" });
        }
        
        if (prescription.status !== 'approved' || prescription.revoked) {
          return res.status(400).json({ 
            message: "Cannot approve order: Prescription has not been approved or has been revoked",
            prescriptionStatus: prescription.status,
            revoked: prescription.revoked
          });
        }
      }
      
      // Generate tracking information
      const trackingNumber = "1Z" + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
      const carrier = Math.random() > 0.5 ? "ups" : "fedex";
      
      // Update the order to shipped status
      const updatedOrder = await storage.updateOrder(orderId, {
        status: "shipped",
        trackingNumber,
        carrier
      });
      
      if (!updatedOrder) {
        return res.status(500).json({ message: "Failed to update order" });
      }
      
      // Send notification to user (mock implementation)
      const user = await storage.getUser(order.userId);
      if (user && user.email) {
        console.log(`Notification email would be sent to ${user.email}: Your order #${order.id} has been approved and shipped. Tracking number: ${trackingNumber} (${carrier})`);
      }
      
      res.json({
        message: "Order approved and shipped",
        order: updatedOrder
      });
    } catch (error) {
      console.error("Error approving order:", error);
      res.status(500).json({ message: "Failed to approve order" });
    }
  });
  
  // Order items routes
  router.post("/orderItems", validateRequest(insertOrderItemSchema), async (req, res) => {
    try {
      const orderItem = await storage.createOrderItem(req.body);
      res.status(201).json(orderItem);
    } catch (err) {
      res.status(500).json({ message: "Failed to create order item" });
    }
  });
  
  router.get("/orderItems/:orderId", async (req, res) => {
    const orderItems = await storage.getOrderItems(Number(req.params.orderId));
    res.json(orderItems);
  });
  
  // Insurance Provider management routes (admin only)
  router.get("/insurance-providers", async (req, res) => {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const providers = await storage.getInsuranceProviders(activeOnly);
      res.json(providers);
    } catch (error) {
      console.error('Error fetching insurance providers:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  router.get("/insurance-providers/:id", async (req, res) => {
    try {
      const provider = await storage.getInsuranceProvider(Number(req.params.id));
      if (!provider) {
        return res.status(404).json({ message: 'Insurance provider not found' });
      }
      res.json(provider);
    } catch (error) {
      console.error('Error fetching insurance provider:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Insurance Providers Endpoints
  
  // Get all insurance providers - accessible by anyone
  router.get("/insurance-providers", async (req, res) => {
    try {
      // Get only active providers if not an admin
      const activeOnly = !req.user || req.user.role !== 'admin';
      const providers = await storage.getInsuranceProviders(activeOnly);
      res.json(providers);
    } catch (error) {
      console.error('Error fetching insurance providers:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get a specific insurance provider by ID
  router.get("/insurance-providers/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const provider = await storage.getInsuranceProvider(id);
      
      if (!provider) {
        return res.status(404).json({ message: 'Insurance provider not found' });
      }
      
      // If user is not an admin and the provider is not active, deny access
      if ((!req.user || req.user.role !== 'admin') && !provider.isActive) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(provider);
    } catch (error) {
      console.error('Error fetching insurance provider:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  router.post("/insurance-providers", isAdmin, validateRequest(insertInsuranceProviderSchema), async (req, res) => {
    try {
      // Check if provider with the same name already exists
      const existingProvider = await storage.getInsuranceProviderByName(req.body.name);
      if (existingProvider) {
        return res.status(409).json({ message: 'An insurance provider with this name already exists' });
      }
      
      const provider = await storage.createInsuranceProvider(req.body);
      res.status(201).json(provider);
    } catch (error) {
      console.error('Error creating insurance provider:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  router.patch("/insurance-providers/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const provider = await storage.getInsuranceProvider(id);
      
      if (!provider) {
        return res.status(404).json({ message: 'Insurance provider not found' });
      }
      
      // Parse and validate the update data
      const parseResult = insertInsuranceProviderSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid insurance provider data", 
          errors: parseResult.error.errors 
        });
      }
      
      // If name is being updated, check for conflicts
      if (parseResult.data.name && parseResult.data.name !== provider.name) {
        const existingProvider = await storage.getInsuranceProviderByName(parseResult.data.name);
        if (existingProvider && existingProvider.id !== id) {
          return res.status(409).json({ message: 'An insurance provider with this name already exists' });
        }
      }
      
      const updatedProvider = await storage.updateInsuranceProvider(id, parseResult.data);
      res.json(updatedProvider);
    } catch (error) {
      console.error('Error updating insurance provider:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  router.delete("/insurance-providers/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const provider = await storage.getInsuranceProvider(id);
      
      if (!provider) {
        return res.status(404).json({ message: 'Insurance provider not found' });
      }
      
      const deleted = await storage.deleteInsuranceProvider(id);
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: 'Failed to delete insurance provider' });
      }
    } catch (error) {
      console.error('Error deleting insurance provider:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Patient Insurance routes
  router.get("/insurance/user/:userId", async (req, res) => {
    const insurances = await storage.getInsurancesByUser(Number(req.params.userId));
    res.json(insurances);
  });
  
  router.get("/insurance/:id", async (req, res) => {
    const insurance = await storage.getInsurance(Number(req.params.id));
    if (!insurance) {
      return res.status(404).json({ message: "Insurance not found" });
    }
    res.json(insurance);
  });
  
  router.post("/insurance", validateRequest(insertInsuranceSchema), async (req, res) => {
    try {
      const insurance = await storage.createInsurance(req.body);
      res.status(201).json(insurance);
    } catch (err) {
      res.status(500).json({ message: "Failed to create insurance" });
    }
  });
  
  router.put("/insurance/:id", async (req, res) => {
    const insurance = await storage.updateInsurance(Number(req.params.id), req.body);
    if (!insurance) {
      return res.status(404).json({ message: "Insurance not found" });
    }
    res.json(insurance);
  });
  
  // Cart routes
  // Authentication-based cart routes
  router.get("/cart", isAuthenticated, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const cart = await storage.getCart(req.user.id);
    res.json(cart || { userId: req.user.id, items: [] });
  });
  
  router.post("/cart", isAuthenticated, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const items = req.body.items as CartItem[];
      const cart = await storage.updateCart(req.user.id, items);
      res.json(cart);
    } catch (err) {
      res.status(500).json({ message: "Failed to update cart" });
    }
  });
  
  router.delete("/cart", isAuthenticated, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      await storage.clearCart(req.user.id);
      res.status(200).json({ message: "Cart cleared successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });
  
  // Legacy cart routes for backward compatibility
  router.get("/cart/:userId", async (req, res) => {
    const cart = await storage.getCart(Number(req.params.userId));
    res.json(cart || { userId: Number(req.params.userId), items: [] });
  });
  
  router.post("/cart/:userId", async (req, res) => {
    try {
      const items = req.body.items as CartItem[];
      const cart = await storage.updateCart(Number(req.params.userId), items);
      res.json(cart);
    } catch (err) {
      res.status(500).json({ message: "Failed to update cart" });
    }
  });
  
  // Refill Request routes
  router.get("/refill-requests/user/:userId", isAuthenticated, async (req, res) => {
    try {
      // Since we're using isAuthenticated middleware, req.user should always exist
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if the authenticated user is requesting their own refill requests
      if (req.user.id !== Number(req.params.userId)) {
        return res.status(403).json({ message: "You can only view your own refill requests" });
      }
      
      const refillRequests = await storage.getRefillRequestsByUser(Number(req.params.userId));
      res.json(refillRequests);
    } catch (err) {
      console.error("Error fetching refill requests:", err);
      res.status(500).json({ message: "Failed to fetch refill requests" });
    }
  });

  router.get("/refill-requests/prescription/:prescriptionId", isAuthenticated, async (req, res) => {
    try {
      // Since we're using isAuthenticated middleware, req.user should always exist
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const refillRequests = await storage.getRefillRequestsByPrescription(Number(req.params.prescriptionId));
      
      // Check if the authenticated user owns these refill requests
      if (refillRequests.length > 0 && req.user.id !== refillRequests[0].userId) {
        return res.status(403).json({ message: "You can only view your own refill requests" });
      }
      
      res.json(refillRequests);
    } catch (err) {
      console.error("Error fetching refill requests by prescription:", err);
      res.status(500).json({ message: "Failed to fetch refill requests" });
    }
  });

  router.get("/refill-requests/:id", isAuthenticated, async (req, res) => {
    try {
      // Since we're using isAuthenticated middleware, req.user should always exist
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const refillRequest = await storage.getRefillRequest(Number(req.params.id));
      if (!refillRequest) {
        return res.status(404).json({ message: "Refill request not found" });
      }
      
      // Check if the authenticated user owns this refill request
      if (req.user.id !== refillRequest.userId) {
        return res.status(403).json({ message: "You can only view your own refill requests" });
      }
      
      res.json(refillRequest);
    } catch (err) {
      console.error("Error fetching refill request:", err);
      res.status(500).json({ message: "Failed to fetch refill request" });
    }
  });

  router.post("/refill-requests", isAuthenticated, validateRequest(insertRefillRequestSchema), async (req, res) => {
    try {
      // Since we're using isAuthenticated middleware, req.user should always exist
      // But let's add an extra check to make TypeScript happy
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Ensure the user can only create refill requests for themselves
      if (req.user.id !== req.body.userId) {
        return res.status(403).json({ message: "You can only create refill requests for yourself" });
      }
      
      // Create the refill request
      const refillRequest = await storage.createRefillRequest(req.body);
      res.status(201).json(refillRequest);
      
      // Create a notification for the user that their refill request was received
      await storage.createRefillNotification({
        userId: req.user.id,
        refillRequestId: refillRequest.id,
        message: "Your refill request has been received and is being processed.",
        notificationType: "status_update"
      });
    } catch (err) {
      console.error("Error creating refill request:", err);
      res.status(500).json({ message: "Failed to create refill request" });
    }
  });

  router.put("/refill-requests/:id", isAuthenticated, async (req, res) => {
    try {
      // Since we're using isAuthenticated middleware, req.user should always exist
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const refillRequest = await storage.getRefillRequest(Number(req.params.id));
      if (!refillRequest) {
        return res.status(404).json({ message: "Refill request not found" });
      }
      
      // Check if the authenticated user owns this refill request
      if (req.user.id !== refillRequest.userId) {
        return res.status(403).json({ message: "You can only update your own refill requests" });
      }
      
      // Update the refill request
      const updatedRequest = await storage.updateRefillRequest(Number(req.params.id), req.body);
      res.json(updatedRequest);
    } catch (err) {
      console.error("Error updating refill request:", err);
      res.status(500).json({ message: "Failed to update refill request" });
    }
  });



  // Refill Notification routes
  router.get("/refill-notifications/user/:userId", isAuthenticated, async (req, res) => {
    try {
      // Since we're using isAuthenticated middleware, req.user should always exist
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if the authenticated user is requesting their own notifications
      if (req.user.id !== Number(req.params.userId)) {
        return res.status(403).json({ message: "You can only view your own notifications" });
      }
      
      const notifications = await storage.getRefillNotificationsByUser(Number(req.params.userId));
      res.json(notifications);
    } catch (err) {
      console.error("Error fetching refill notifications:", err);
      res.status(500).json({ message: "Failed to fetch refill notifications" });
    }
  });

  router.get("/refill-notifications/request/:requestId", isAuthenticated, async (req, res) => {
    try {
      // Since we're using isAuthenticated middleware, req.user should always exist
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const refillRequest = await storage.getRefillRequest(Number(req.params.requestId));
      if (!refillRequest) {
        return res.status(404).json({ message: "Refill request not found" });
      }
      
      // Check if the authenticated user owns this refill request
      if (req.user.id !== refillRequest.userId) {
        return res.status(403).json({ message: "You can only view notifications for your own refill requests" });
      }
      
      const notifications = await storage.getRefillNotificationsByRefillRequest(Number(req.params.requestId));
      res.json(notifications);
    } catch (err) {
      console.error("Error fetching refill notifications by request:", err);
      res.status(500).json({ message: "Failed to fetch refill notifications" });
    }
  });

  router.post("/refill-notifications/mark-read/:id", isAuthenticated, async (req, res) => {
    try {
      // Since we're using isAuthenticated middleware, req.user should always exist
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const notification = await storage.getRefillNotification(Number(req.params.id));
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      // Check if the authenticated user owns this notification
      if (req.user.id !== notification.userId) {
        return res.status(403).json({ message: "You can only mark your own notifications as read" });
      }
      
      // Mark the notification as read
      const updatedNotification = await storage.markRefillNotificationAsRead(Number(req.params.id));
      res.json(updatedNotification);
    } catch (err) {
      console.error("Error marking notification as read:", err);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Special endpoint to create a test user (for development only)
  router.post("/create-test-user", async (_req, res) => {
    try {
      const testUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '555-123-4567',
        address: '123 Main St, Anytown, USA',
        dateOfBirth: '1990-01-01',
        sexAtBirth: 'male'
      };
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(testUser.email);
      if (existingUser) {
        return res.json(existingUser);
      }
      
      const user = await storage.createUser(testUser);
      res.status(201).json(user);
    } catch (err) {
      console.error("Failed to create test user:", err);
      res.status(500).json({ message: "Failed to create test user" });
    }
  });
  
  // White Label Configuration routes
  router.get("/white-labels", isAuthenticated, async (req, res) => {
    try {
      // Check if the authenticated user is an admin (add admin role check when available)
      // For now, allow any authenticated user to get white labels
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const whiteLabels = await storage.getWhiteLabels();
      res.json(whiteLabels);
    } catch (err) {
      console.error("Error fetching white labels:", err);
      res.status(500).json({ message: "Failed to fetch white labels" });
    }
  });
  
  router.get("/white-labels/active", async (req, res) => {
    try {
      const whiteLabel = await storage.getActiveWhiteLabel();
      if (!whiteLabel) {
        return res.status(404).json({ message: "No active white label configuration found" });
      }
      res.json(whiteLabel);
    } catch (err) {
      console.error("Error fetching active white label:", err);
      res.status(500).json({ message: "Failed to fetch active white label" });
    }
  });
  
  // Route to get the configuration for the frontend
  router.get("/white-labels/config", async (req, res) => {
    try {
      // First try to get the active white label
      let whiteLabel = await storage.getActiveWhiteLabel();
      
      // If no active white label, try the default one
      if (!whiteLabel) {
        whiteLabel = await storage.getDefaultWhiteLabel();
      }
      
      // If still no white label, return a default config
      if (!whiteLabel) {
        return res.json({
          name: "BoltEHR Pharmacy",
          primaryColor: "#0070f3",
          secondaryColor: "#f5f5f5",
          accentColor: "#ff4081",
          fontFamily: "Inter, sans-serif",
          tagline: "Your trusted online pharmacy for affordable medications",
          allowGuestCart: true,
        });
      }
      
      res.json(whiteLabel);
    } catch (err) {
      console.error("Error fetching white label config:", err);
      res.status(500).json({ message: "Failed to fetch white label config" });
    }
  });
  
  router.patch("/white-labels/config", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can update the white label configuration" });
      }
      
      // First try to get the active white label
      let whiteLabel = await storage.getActiveWhiteLabel();
      
      // If no active white label, try the default one
      if (!whiteLabel) {
        whiteLabel = await storage.getDefaultWhiteLabel();
      }
      
      // If no white label exists, create a new one with the provided config
      if (!whiteLabel) {
        const newWhiteLabel = await storage.createWhiteLabel({
          ...req.body,
          isActive: true,
          isDefault: true
        });
        
        return res.status(201).json(newWhiteLabel);
      }
      
      // Update the existing white label
      const updatedWhiteLabel = await storage.updateWhiteLabel(whiteLabel.id, req.body);
      
      res.json(updatedWhiteLabel);
    } catch (err) {
      console.error("Error updating white label config:", err);
      res.status(500).json({ message: "Failed to update white label config" });
    }
  });
  
  router.get("/white-labels/default", async (req, res) => {
    try {
      const defaultWhiteLabel = await storage.getDefaultWhiteLabel();
      if (!defaultWhiteLabel) {
        return res.status(404).json({ message: "No default white label configuration found" });
      }
      res.json(defaultWhiteLabel);
    } catch (err) {
      console.error("Error fetching default white label:", err);
      res.status(500).json({ message: "Failed to fetch default white label" });
    }
  });
  
  // New endpoint to parse theme from a website URL
  router.post("/white-labels/parse-website", isAuthenticated, async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }
      
      console.log(`Attempting to parse theme from website: ${url}`);
      const theme = await parseWebsiteTheme(url);
      
      console.log(`Successfully parsed theme from ${url}:`, theme);
      res.json(theme);
    } catch (error) {
      console.error("Error parsing website theme:", error);
      res.status(500).json({ 
        message: "Failed to parse website theme", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  router.get("/white-labels/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const whiteLabel = await storage.getWhiteLabel(Number(req.params.id));
      if (!whiteLabel) {
        return res.status(404).json({ message: "White label configuration not found" });
      }
      res.json(whiteLabel);
    } catch (err) {
      console.error("Error fetching white label:", err);
      res.status(500).json({ message: "Failed to fetch white label" });
    }
  });
  
  router.post("/white-labels", isAuthenticated, validateRequest(insertWhiteLabelSchema), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if a white label with the same name already exists
      const existingWhiteLabel = await storage.getWhiteLabelByName(req.body.name);
      if (existingWhiteLabel) {
        return res.status(409).json({ message: "White label with this name already exists" });
      }
      
      const whiteLabel = await storage.createWhiteLabel(req.body);
      res.status(201).json(whiteLabel);
    } catch (err) {
      console.error("Error creating white label:", err);
      res.status(500).json({ message: "Failed to create white label" });
    }
  });
  
  router.put("/white-labels/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const whiteLabel = await storage.getWhiteLabel(Number(req.params.id));
      if (!whiteLabel) {
        return res.status(404).json({ message: "White label configuration not found" });
      }
      
      // If name is being changed, check for duplicates
      if (req.body.name && req.body.name !== whiteLabel.name) {
        const existingWhiteLabel = await storage.getWhiteLabelByName(req.body.name);
        if (existingWhiteLabel && existingWhiteLabel.id !== Number(req.params.id)) {
          return res.status(409).json({ message: "White label with this name already exists" });
        }
      }
      
      const updatedWhiteLabel = await storage.updateWhiteLabel(Number(req.params.id), req.body);
      res.json(updatedWhiteLabel);
    } catch (err) {
      console.error("Error updating white label:", err);
      res.status(500).json({ message: "Failed to update white label" });
    }
  });
  
  router.post("/white-labels/:id/activate", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const whiteLabel = await storage.getWhiteLabel(Number(req.params.id));
      if (!whiteLabel) {
        return res.status(404).json({ message: "White label configuration not found" });
      }
      
      const activatedWhiteLabel = await storage.activateWhiteLabel(Number(req.params.id));
      res.json(activatedWhiteLabel);
    } catch (err) {
      console.error("Error activating white label:", err);
      res.status(500).json({ message: "Failed to activate white label" });
    }
  });
  
  router.post("/white-labels/:id/deactivate", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const whiteLabel = await storage.getWhiteLabel(Number(req.params.id));
      if (!whiteLabel) {
        return res.status(404).json({ message: "White label configuration not found" });
      }
      
      const deactivatedWhiteLabel = await storage.deactivateWhiteLabel(Number(req.params.id));
      res.json(deactivatedWhiteLabel);
    } catch (err) {
      console.error("Error deactivating white label:", err);
      res.status(500).json({ message: "Failed to deactivate white label" });
    }
  });

  // White Label Default Configuration routes
  router.post("/white-labels/:id/set-default", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const whiteLabel = await storage.getWhiteLabel(Number(req.params.id));
      if (!whiteLabel) {
        return res.status(404).json({ message: "White label configuration not found" });
      }
      
      const defaultWhiteLabel = await storage.setDefaultWhiteLabel(Number(req.params.id));
      res.json(defaultWhiteLabel);
    } catch (err) {
      console.error("Error setting default white label:", err);
      res.status(500).json({ message: "Failed to set default white label" });
    }
  });

  router.post("/white-labels/:id/unset-default", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const whiteLabel = await storage.getWhiteLabel(Number(req.params.id));
      if (!whiteLabel) {
        return res.status(404).json({ message: "White label configuration not found" });
      }
      
      const whitelabel = await storage.unsetDefaultWhiteLabel(Number(req.params.id));
      res.json(whitelabel);
    } catch (err) {
      console.error("Error unsetting default white label:", err);
      res.status(500).json({ message: "Failed to unset default white label" });
    }
  });
  
  // Shipping API Routes
  router.post("/shipping/rates", isAuthenticated, async (req, res) => {
    try {
      // Validate required fields
      const { destination, packageDetails } = req.body;
      
      if (!destination || !destination.street1 || !destination.city || !destination.state || !destination.zip) {
        return res.status(400).json({ message: "Invalid shipping address. Street, city, state, and ZIP code are required." });
      }
      
      // Get shipping rates
      const rates = await shippingService.getShippingRates(destination, packageDetails);
      res.json(rates);
    } catch (error) {
      console.error("Error calculating shipping rates:", error);
      res.status(500).json({ message: "Failed to calculate shipping rates" });
    }
  });
  
  router.post("/shipping/label", isAuthenticated, async (req, res) => {
    try {
      // Validate required fields
      const { destination, carrierId, serviceCode, packageDetails } = req.body;
      
      if (!destination || !destination.street1 || !destination.city || !destination.state || !destination.zip) {
        return res.status(400).json({ message: "Invalid shipping address. Street, city, state, and ZIP code are required." });
      }
      
      if (!carrierId || !serviceCode) {
        return res.status(400).json({ message: "Carrier ID and service code are required." });
      }
      
      // Create shipping label
      const shippingLabel = await shippingService.createShippingLabel(
        destination, 
        carrierId, 
        serviceCode, 
        packageDetails
      );
      
      res.json(shippingLabel);
    } catch (error) {
      console.error("Error creating shipping label:", error);
      res.status(500).json({ message: "Failed to create shipping label" });
    }
  });
  
  router.get("/shipping/track/:trackingNumber", async (req, res) => {
    try {
      const { trackingNumber } = req.params;
      const carrierId = req.query.carrier as string;
      
      if (!trackingNumber || !carrierId) {
        return res.status(400).json({ message: "Tracking number and carrier ID are required." });
      }
      
      // Get the destination address if available (for better tracking information)
      const destination = req.query.userId ? 
        await (async () => {
          const user = await storage.getUser(Number(req.query.userId));
          if (user && user.address) {
            return {
              name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
              street1: user.address,
              city: user.city || "",
              state: user.state || "",
              zip: user.zipCode || "",  // This matches the schema field name
              country: "US",
              phone: user.phone || ""
            };
          }
          return undefined;
        })() : undefined;
      
      // Track package
      const trackingInfo = await shippingService.trackPackage(trackingNumber, carrierId, destination);
      res.json(trackingInfo);
    } catch (error) {
      console.error("Error tracking package:", error);
      res.status(500).json({ message: "Failed to track package" });
    }
  });
  
  // User Medications API Routes
  router.get("/user-medications", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userMedications = await storage.getUserMedicationsByUser(req.user.id);
      
      // Fetch medication details for each user medication
      const medicationIdsSet = new Set(userMedications.map(med => med.medicationId));
      const medicationIds = Array.from(medicationIdsSet);
      const medications = await Promise.all(
        medicationIds.map(id => storage.getMedication(id))
      );
      
      const medicationsMap = new Map();
      medications.forEach(med => {
        if (med) medicationsMap.set(med.id, med);
      });
      
      // Combine user medication data with medication details
      const detailedUserMedications = userMedications.map(userMed => {
        const medication = medicationsMap.get(userMed.medicationId);
        return {
          ...userMed,
          medication: medication ? {
            id: medication.id,
            name: medication.name,
            genericName: medication.genericName,
            brandName: medication.brandName,
            dosage: medication.dosage,
            imageUrl: medication.imageUrl,
            category: medication.category
          } : null
        };
      });
      
      res.json(detailedUserMedications);
    } catch (error) {
      console.error("Error fetching user medications:", error);
      res.status(500).json({ message: "Failed to fetch user medications" });
    }
  });
  
  router.get("/user-medications/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userMedicationId = parseInt(req.params.id);
      const userMedication = await storage.getUserMedication(userMedicationId);
      
      if (!userMedication) {
        return res.status(404).json({ message: "User medication not found" });
      }
      
      // Check if this medication belongs to the requesting user
      if (userMedication.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Fetch medication details
      const medication = await storage.getMedication(userMedication.medicationId);
      
      const userMedicationWithDetails = {
        ...userMedication,
        medication: medication ? {
          id: medication.id,
          name: medication.name,
          genericName: medication.genericName,
          brandName: medication.brandName,
          dosage: medication.dosage,
          imageUrl: medication.imageUrl,
          category: medication.category
        } : null
      };
      
      res.json(userMedicationWithDetails);
    } catch (error) {
      console.error("Error fetching user medication:", error);
      res.status(500).json({ message: "Failed to fetch user medication" });
    }
  });
  
  router.post("/user-medications", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const medicationData = {
        ...req.body,
        userId: req.user.id,
        source: req.body.source || "manual"
      };
      
      const newUserMedication = await storage.createUserMedication(medicationData);
      
      res.status(201).json(newUserMedication);
    } catch (error) {
      console.error("Error creating user medication:", error);
      res.status(500).json({ message: "Failed to create user medication" });
    }
  });
  
  router.put("/user-medications/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userMedicationId = parseInt(req.params.id);
      const userMedication = await storage.getUserMedication(userMedicationId);
      
      if (!userMedication) {
        return res.status(404).json({ message: "User medication not found" });
      }
      
      // Check if this medication belongs to the requesting user
      if (userMedication.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const medicationData = req.body;
      const updatedUserMedication = await storage.updateUserMedication(userMedicationId, medicationData);
      
      res.json(updatedUserMedication);
    } catch (error) {
      console.error("Error updating user medication:", error);
      res.status(500).json({ message: "Failed to update user medication" });
    }
  });
  
  router.patch("/user-medications/:id/toggle-active", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userMedicationId = parseInt(req.params.id);
      const userMedication = await storage.getUserMedication(userMedicationId);
      
      if (!userMedication) {
        return res.status(404).json({ message: "User medication not found" });
      }
      
      // Check if this medication belongs to the requesting user
      if (userMedication.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { active } = req.body;
      if (typeof active !== 'boolean') {
        return res.status(400).json({ message: "Active status must be a boolean" });
      }
      
      const updatedUserMedication = await storage.toggleUserMedicationActive(userMedicationId, active);
      
      res.json(updatedUserMedication);
    } catch (error) {
      console.error("Error toggling user medication active status:", error);
      res.status(500).json({ message: "Failed to toggle user medication active status" });
    }
  });
  
  router.delete("/user-medications/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userMedicationId = parseInt(req.params.id);
      const userMedication = await storage.getUserMedication(userMedicationId);
      
      if (!userMedication) {
        return res.status(404).json({ message: "User medication not found" });
      }
      
      // Check if this medication belongs to the requesting user
      if (userMedication.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const success = await storage.deleteUserMedication(userMedicationId);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Failed to delete user medication" });
      }
    } catch (error) {
      console.error("Error deleting user medication:", error);
      res.status(500).json({ message: "Failed to delete user medication" });
    }
  });
  
  // Auto-add medication from order
  router.post("/orders/:orderId/add-to-medications", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const orderId = parseInt(req.params.orderId);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Check if this order belongs to the requesting user
      if (order.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get order items
      const orderItems = await storage.getOrderItems(orderId);
      
      if (!orderItems || orderItems.length === 0) {
        return res.status(404).json({ message: "No order items found" });
      }
      
      // Add each medication from the order to the user's medication list
      const addedMedications = [];
      for (const item of orderItems) {
        const userMed = await storage.addUserMedicationFromOrder(
          req.user.id,
          item.medicationId,
          "order"
        );
        
        if (userMed) {
          addedMedications.push(userMed);
        }
      }
      
      res.status(201).json({
        message: `${addedMedications.length} medications added to your list`,
        medications: addedMedications
      });
    } catch (error) {
      console.error("Error adding medications from order:", error);
      res.status(500).json({ message: "Failed to add medications from order" });
    }
  });
  
  // Auto-add medication from prescription
  router.post("/prescriptions/:prescriptionId/add-to-medications", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const prescriptionId = parseInt(req.params.prescriptionId);
      const prescription = await storage.getPrescription(prescriptionId);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      // Check if this prescription belongs to the requesting user
      if (prescription.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get the medication ID from the request body
      const { medicationId } = req.body;
      
      if (!medicationId) {
        return res.status(400).json({ message: "Medication ID is required" });
      }
      
      // Add the medication from the prescription to the user's medication list
      const userMed = await storage.addUserMedicationFromPrescription(
        req.user.id,
        medicationId,
        prescriptionId
      );
      
      if (!userMed) {
        return res.status(404).json({ message: "Failed to add medication from prescription" });
      }
      
      res.status(201).json({
        message: "Medication added to your list",
        medication: userMed
      });
    } catch (error) {
      console.error("Error adding medication from prescription:", error);
      res.status(500).json({ message: "Failed to add medication from prescription" });
    }
  });

  // Inventory Provider routes (admin only)
  router.get("/inventory/providers", isAdmin, async (req, res) => {
    try {
      const activeOnly = req.query.active === 'true';
      const providers = await storage.getInventoryProviders(activeOnly);
      res.json(providers);
    } catch (err) {
      console.error("Error fetching inventory providers:", err);
      res.status(500).json({ message: "Failed to fetch inventory providers" });
    }
  });

  router.get("/inventory/providers/:id", isAdmin, async (req, res) => {
    try {
      const provider = await storage.getInventoryProvider(Number(req.params.id));
      if (!provider) {
        return res.status(404).json({ message: "Inventory provider not found" });
      }
      res.json(provider);
    } catch (err) {
      console.error("Error fetching inventory provider:", err);
      res.status(500).json({ message: "Failed to fetch inventory provider" });
    }
  });

  router.post("/inventory/providers", isAdmin, validateRequest(insertInventoryProviderSchema), async (req, res) => {
    try {
      const existingProvider = await storage.getInventoryProviderByName(req.body.name);
      if (existingProvider) {
        return res.status(409).json({ message: "A provider with this name already exists" });
      }
      
      const provider = await storage.createInventoryProvider(req.body);
      res.status(201).json(provider);
    } catch (err) {
      console.error("Error creating inventory provider:", err);
      res.status(500).json({ message: "Failed to create inventory provider" });
    }
  });

  router.put("/inventory/providers/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const provider = await storage.getInventoryProvider(id);
      
      if (!provider) {
        return res.status(404).json({ message: "Inventory provider not found" });
      }
      
      // Validate the request body
      const parseResult = insertInventoryProviderSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid inventory provider data", 
          errors: parseResult.error.errors 
        });
      }
      
      // If name is being updated, check for conflicts
      if (parseResult.data.name && parseResult.data.name !== provider.name) {
        const existingProvider = await storage.getInventoryProviderByName(parseResult.data.name);
        if (existingProvider && existingProvider.id !== id) {
          return res.status(409).json({ message: 'A provider with this name already exists' });
        }
      }
      
      const updatedProvider = await storage.updateInventoryProvider(id, parseResult.data);
      res.json(updatedProvider);
    } catch (err) {
      console.error("Error updating inventory provider:", err);
      res.status(500).json({ message: "Failed to update inventory provider" });
    }
  });

  router.delete("/inventory/providers/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const provider = await storage.getInventoryProvider(id);
      
      if (!provider) {
        return res.status(404).json({ message: "Inventory provider not found" });
      }
      
      // Get all items for this provider to check if any are in use
      const items = await storage.getInventoryItemsByProvider(id);
      if (items.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete provider with associated inventory items. Deactivate it instead.",
          itemCount: items.length
        });
      }
      
      const deleted = await storage.deleteInventoryProvider(id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete inventory provider" });
      }
      
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting inventory provider:", err);
      res.status(500).json({ message: "Failed to delete inventory provider" });
    }
  });
  
  // Inventory Item routes
  router.get("/inventory/items", isAdmin, async (req, res) => {
    try {
      const providerId = req.query.providerId ? Number(req.query.providerId) : undefined;
      
      if (providerId) {
        const items = await storage.getInventoryItemsByProvider(providerId);
        return res.json(items);
      } else {
        // This endpoint could be expensive if there are many items across providers
        // In a real application, you would want to implement pagination here
        const allItems = []; 
        const providers = await storage.getInventoryProviders(true);
        
        for (const provider of providers) {
          const items = await storage.getInventoryItemsByProvider(provider.id);
          allItems.push(...items);
        }
        
        res.json(allItems);
      }
    } catch (err) {
      console.error("Error fetching inventory items:", err);
      res.status(500).json({ message: "Failed to fetch inventory items" });
    }
  });

  router.get("/inventory/items/:id", isAdmin, async (req, res) => {
    try {
      const item = await storage.getInventoryItem(Number(req.params.id));
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res.json(item);
    } catch (err) {
      console.error("Error fetching inventory item:", err);
      res.status(500).json({ message: "Failed to fetch inventory item" });
    }
  });

  router.post("/inventory/items", isAdmin, validateRequest(insertInventoryItemSchema), async (req, res) => {
    try {
      // Verify provider exists
      const provider = await storage.getInventoryProvider(req.body.providerId);
      if (!provider) {
        return res.status(404).json({ message: "Inventory provider not found" });
      }
      
      // Check if item with external ID already exists for this provider
      const existingItem = await storage.getInventoryItemByExternalId(req.body.providerId, req.body.externalId);
      if (existingItem) {
        return res.status(409).json({ message: "An item with this external ID already exists for this provider" });
      }
      
      const item = await storage.createInventoryItem(req.body);
      res.status(201).json(item);
    } catch (err) {
      console.error("Error creating inventory item:", err);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  router.put("/inventory/items/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const item = await storage.getInventoryItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      // Validate the request body
      const parseResult = insertInventoryItemSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid inventory item data", 
          errors: parseResult.error.errors 
        });
      }
      
      // If provider or external ID is changing, check for conflicts
      if ((parseResult.data.providerId || parseResult.data.externalId) && 
          (parseResult.data.providerId !== item.providerId || parseResult.data.externalId !== item.externalId)) {
        const providerId = parseResult.data.providerId || item.providerId;
        const externalId = parseResult.data.externalId || item.externalId;
        
        const existingItem = await storage.getInventoryItemByExternalId(providerId, externalId);
        if (existingItem && existingItem.id !== id) {
          return res.status(409).json({ message: 'An item with this external ID already exists for this provider' });
        }
      }
      
      const updatedItem = await storage.updateInventoryItem(id, parseResult.data);
      res.json(updatedItem);
    } catch (err) {
      console.error("Error updating inventory item:", err);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  router.delete("/inventory/items/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const item = await storage.getInventoryItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      // Check if this item is used in any mappings
      const mappings = await storage.getInventoryMappingsByItem(id);
      if (mappings.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete item that is mapped to medications. Remove mappings first.",
          mappingCount: mappings.length
        });
      }
      
      const deleted = await storage.deleteInventoryItem(id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete inventory item" });
      }
      
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting inventory item:", err);
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });
  
  // Inventory Mapping routes
  router.get("/inventory/mappings", isAdmin, async (req, res) => {
    try {
      // We can filter by medication ID or inventory item ID
      const medicationId = req.query.medicationId ? Number(req.query.medicationId) : undefined;
      const inventoryItemId = req.query.inventoryItemId ? Number(req.query.inventoryItemId) : undefined;
      
      let mappings = [];
      
      if (medicationId) {
        mappings = await storage.getInventoryMappingsByMedication(medicationId);
      } else if (inventoryItemId) {
        mappings = await storage.getInventoryMappingsByItem(inventoryItemId);
      } else {
        // In a real application, this would need pagination
        // For now, we'll just return all mappings (limit to 100 for safety)
        const allMeds = await storage.getMedications(100, 0);
        
        for (const med of allMeds) {
          const medMappings = await storage.getInventoryMappingsByMedication(med.id);
          mappings.push(...medMappings);
        }
      }
      
      // Enhance mappings with medication and inventory item details
      const enhancedMappings = await Promise.all(mappings.map(async (mapping) => {
        const medication = await storage.getMedication(mapping.medicationId);
        const inventoryItem = await storage.getInventoryItem(mapping.inventoryItemId);
        const provider = inventoryItem ? await storage.getInventoryProvider(inventoryItem.providerId) : null;
        
        return {
          ...mapping,
          medication: medication || null,
          inventoryItem: inventoryItem || null,
          provider: provider || null
        };
      }));
      
      res.json(enhancedMappings);
    } catch (err) {
      console.error("Error fetching inventory mappings:", err);
      res.status(500).json({ message: "Failed to fetch inventory mappings" });
    }
  });

  router.get("/inventory/mappings/:id", isAdmin, async (req, res) => {
    try {
      const mapping = await storage.getInventoryMapping(Number(req.params.id));
      if (!mapping) {
        return res.status(404).json({ message: "Inventory mapping not found" });
      }
      
      // Get related entities
      const medication = await storage.getMedication(mapping.medicationId);
      const inventoryItem = await storage.getInventoryItem(mapping.inventoryItemId);
      const provider = inventoryItem ? await storage.getInventoryProvider(inventoryItem.providerId) : null;
      
      res.json({
        ...mapping,
        medication: medication || null,
        inventoryItem: inventoryItem || null,
        provider: provider || null
      });
    } catch (err) {
      console.error("Error fetching inventory mapping:", err);
      res.status(500).json({ message: "Failed to fetch inventory mapping" });
    }
  });

  router.post("/inventory/mappings", isAdmin, validateRequest(insertInventoryMappingSchema), async (req, res) => {
    try {
      // Verify medication exists
      const medication = await storage.getMedication(req.body.medicationId);
      if (!medication) {
        return res.status(404).json({ message: "Medication not found" });
      }
      
      // Verify inventory item exists
      const inventoryItem = await storage.getInventoryItem(req.body.inventoryItemId);
      if (!inventoryItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      // Check if a mapping already exists between these items
      const existingMapping = await storage.getInventoryMappingByItemAndMedication(
        req.body.inventoryItemId, 
        req.body.medicationId
      );
      
      if (existingMapping) {
        return res.status(409).json({ 
          message: "A mapping already exists between this medication and inventory item",
          existingId: existingMapping.id
        });
      }
      
      // If this is a primary mapping, we need to set all other mappings for this medication to non-primary
      if (req.body.isPrimary) {
        const existingMappings = await storage.getInventoryMappingsByMedication(req.body.medicationId);
        for (const mapping of existingMappings) {
          if (mapping.isPrimary) {
            await storage.updateInventoryMapping(mapping.id, { isPrimary: false });
          }
        }
      }
      
      const mapping = await storage.createInventoryMapping(req.body);
      res.status(201).json(mapping);
    } catch (err) {
      console.error("Error creating inventory mapping:", err);
      res.status(500).json({ message: "Failed to create inventory mapping" });
    }
  });

  router.put("/inventory/mappings/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const mapping = await storage.getInventoryMapping(id);
      
      if (!mapping) {
        return res.status(404).json({ message: "Inventory mapping not found" });
      }
      
      // Validate the request body
      const parseResult = insertInventoryMappingSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid inventory mapping data", 
          errors: parseResult.error.errors 
        });
      }
      
      // If making this a primary mapping, update all other mappings for this medication
      if (parseResult.data.isPrimary && parseResult.data.isPrimary !== mapping.isPrimary) {
        const existingMappings = await storage.getInventoryMappingsByMedication(mapping.medicationId);
        for (const m of existingMappings) {
          if (m.id !== id && m.isPrimary) {
            await storage.updateInventoryMapping(m.id, { isPrimary: false });
          }
        }
      }
      
      const updatedMapping = await storage.updateInventoryMapping(id, parseResult.data);
      res.json(updatedMapping);
    } catch (err) {
      console.error("Error updating inventory mapping:", err);
      res.status(500).json({ message: "Failed to update inventory mapping" });
    }
  });

  router.delete("/inventory/mappings/:id", isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const mapping = await storage.getInventoryMapping(id);
      
      if (!mapping) {
        return res.status(404).json({ message: "Inventory mapping not found" });
      }
      
      const deleted = await storage.deleteInventoryMapping(id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete inventory mapping" });
      }
      
      res.status(204).send();
    } catch (err) {
      console.error("Error deleting inventory mapping:", err);
      res.status(500).json({ message: "Failed to delete inventory mapping" });
    }
  });

  // Register API routes
  app.use("/api", router);
  
  // Add special route for reinitializing users
  app.get('/api/reinitialize-users', async (_req, res) => {
    try {
      // Create a test user
      const testUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: await hashPassword('password123'),
        firstName: 'Test',
        lastName: 'User',
        phone: '555-123-4567',
        address: '123 Main St, Anytown, USA',
        dateOfBirth: '1990-01-01',
        sexAtBirth: 'male',
        role: 'user'
      };
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(testUser.email);
      if (!existingUser) {
        await storage.createUser(testUser);
        console.log('Test user created successfully');
      } else {
        console.log('Test user already exists');
      }
      
      // Create admin user via the initialize function
      const adminResult = await initializeAdminUser();
      
      return res.status(200).json({
        message: 'Users reinitialized successfully',
        testUser: { email: 'test@example.com', password: 'password123' },
        adminUser: { email: 'admin@example.com', password: 'Admin123!' },
        adminResult
      });
    } catch (error) {
      console.error('Error reinitializing users:', error);
      return res.status(500).json({ message: 'Failed to reinitialize users', error: String(error) });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
