import express, { type Request, Response } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { ZodError } from "zod";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from './auth';
import { shippingService, type ShippingAddress, type PackageDetails } from './services/shipping';
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

  router.get("/users/:id", async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });
  
  router.put("/users/:id", isAuthenticated, async (req, res) => {
    try {
      // Check if the authenticated user is updating their own profile
      if (req.user?.id !== Number(req.params.id)) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      // Filter out sensitive fields that shouldn't be updated directly
      const { password, ...updateData } = req.body;
      
      // Perform the update
      const user = await storage.updateUser(Number(req.params.id), updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update session user data
      if (req.user) {
        Object.assign(req.user, user);
      }
      
      res.json(user);
    } catch (err) {
      console.error("Error updating user profile:", err);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });
  
  // Allergy management routes
  router.put("/users/:id/allergies", isAuthenticated, async (req, res) => {
    try {
      // Check if the authenticated user is updating their own allergies
      if (req.user?.id !== Number(req.params.id)) {
        return res.status(403).json({ message: "You can only update your own allergies" });
      }
      
      const { allergies, noKnownAllergies } = req.body;
      
      // Validate the input
      if (!Array.isArray(allergies) && typeof noKnownAllergies !== 'boolean') {
        return res.status(400).json({ message: "Invalid allergies data. Provide an array of allergies and a boolean for noKnownAllergies." });
      }
      
      // Apply the update
      const user = await storage.updateUserAllergies(
        Number(req.params.id), 
        allergies || [], 
        noKnownAllergies || false
      );
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update session user data
      if (req.user) {
        Object.assign(req.user, user);
      }
      
      res.json(user);
    } catch (err) {
      console.error("Error updating user allergies:", err);
      res.status(500).json({ message: "Failed to update allergies" });
    }
  });
  
  // Admin route to verify allergies
  router.put("/users/:id/allergies/verify", isAdmin, async (req, res) => {
    try {
      const user = await storage.verifyUserAllergies(Number(req.params.id));
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (err) {
      console.error("Error verifying allergies:", err);
      res.status(500).json({ message: "Failed to verify allergies" });
    }
  });
  
  // Admin route to get users without verified allergies
  router.get("/users/allergies/unverified", isAdmin, async (_req, res) => {
    try {
      const users = await storage.getUsersWithoutVerifiedAllergies();
      res.json(users);
    } catch (err) {
      console.error("Error fetching unverified allergies:", err);
      res.status(500).json({ message: "Failed to fetch users with unverified allergies" });
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
  
  // Register API routes
  app.use("/api", router);
  
  const httpServer = createServer(app);
  return httpServer;
}
