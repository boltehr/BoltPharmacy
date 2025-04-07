import express, { type Request, Response } from "express";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertMedicationSchema,
  insertCategorySchema,
  insertPrescriptionSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertInsuranceSchema,
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
  
  // User routes
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
  
  router.get("/users/:id", async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });
  
  router.put("/users/:id", async (req, res) => {
    const user = await storage.updateUser(Number(req.params.id), req.body);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
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
  
  router.post("/medications", validateRequest(insertMedicationSchema), async (req, res) => {
    try {
      const medication = await storage.createMedication(req.body);
      res.status(201).json(medication);
    } catch (err) {
      res.status(500).json({ message: "Failed to create medication" });
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
  
  router.post("/categories", validateRequest(insertCategorySchema), async (req, res) => {
    try {
      const category = await storage.createCategory(req.body);
      res.status(201).json(category);
    } catch (err) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });
  
  // Prescription routes
  router.get("/prescriptions/user/:userId", async (req, res) => {
    const prescriptions = await storage.getPrescriptionsByUser(Number(req.params.userId));
    res.json(prescriptions);
  });
  
  router.get("/prescriptions/:id", async (req, res) => {
    const prescription = await storage.getPrescription(Number(req.params.id));
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }
    res.json(prescription);
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
    res.json({ ...order, items: orderItems });
  });
  
  router.post("/orders", validateRequest(insertOrderSchema), async (req, res) => {
    try {
      const order = await storage.createOrder(req.body);
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
  
  // Insurance routes
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
  
  // Register API routes
  app.use("/api", router);
  
  const httpServer = createServer(app);
  return httpServer;
}
