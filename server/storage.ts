import {
  users, type User, type InsertUser,
  medications, type Medication, type InsertMedication,
  categories, type Category, type InsertCategory,
  prescriptions, type Prescription, type InsertPrescription,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem,
  insurance, type Insurance, type InsertInsurance,
  insuranceProviders, type InsuranceProvider, type InsertInsuranceProvider,
  cart, type Cart, type InsertCart, type CartItem,
  refillRequests, type RefillRequest, type InsertRefillRequest,
  refillNotifications, type RefillNotification, type InsertRefillNotification,
  whiteLabels, type WhiteLabel, type InsertWhiteLabel,
  inventoryProviders, type InventoryProvider, type InsertInventoryProvider,
  inventoryItems, type InventoryItem, type InsertInventoryItem,
  inventoryMappings, type InventoryMapping, type InsertInventoryMapping,
  userMedications, type UserMedication, type InsertUserMedication
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, like, desc, and, sql } from "drizzle-orm";

// Storage interface
import session from "express-session";
import connectPg from "connect-pg-simple";
import memorystore from "memorystore";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserRole(id: number, role: string): Promise<boolean>;
  
  // Password reset methods
  storePasswordResetToken(userId: number, token: string, expiry: Date): Promise<boolean>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  resetPassword(userId: number, newPassword: string): Promise<boolean>;
  

  
  // Session store
  sessionStore: session.Store;
  
  // Insurance Provider methods
  getInsuranceProvider(id: number): Promise<InsuranceProvider | undefined>;
  getInsuranceProviderByName(name: string): Promise<InsuranceProvider | undefined>;
  getInsuranceProviders(activeOnly?: boolean): Promise<InsuranceProvider[]>;
  createInsuranceProvider(provider: InsertInsuranceProvider): Promise<InsuranceProvider>;
  updateInsuranceProvider(id: number, provider: Partial<InsertInsuranceProvider>): Promise<InsuranceProvider | undefined>;
  deleteInsuranceProvider(id: number): Promise<boolean>;

  // Medication methods
  getMedication(id: number): Promise<Medication | undefined>;
  getMedications(limit?: number, offset?: number): Promise<Medication[]>;
  getMedicationsByCategory(category: string): Promise<Medication[]>;
  searchMedications(query: string): Promise<Medication[]>;
  getPopularMedications(limit: number): Promise<Medication[]>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  updateMedication(id: number, medication: Partial<InsertMedication>): Promise<Medication | undefined>;
  
  // Category methods
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryByName(name: string): Promise<Category | undefined>;
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  
  // Prescription methods
  getPrescription(id: number): Promise<Prescription | undefined>;
  getPrescriptionsByUser(userId: number): Promise<Prescription[]>;
  getPrescriptionsForVerification(status?: string, limit?: number, offset?: number): Promise<Prescription[]>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: number, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined>;
  
  // Prescription verification methods
  verifyPrescription(id: number, verifierId: number, verificationData: {
    status: string,
    verificationMethod: string,
    verificationNotes?: string,
    expirationDate?: Date
  }): Promise<Prescription | undefined>;
  
  revokePrescription(id: number, reason: string): Promise<Prescription | undefined>;
  
  generateSecurityCode(prescriptionId: number): Promise<string>;
  
  validatePrescriptionForMedication(prescriptionId: number, medicationId: number): Promise<{
    valid: boolean,
    reason?: string
  }>;
  
  // Order methods
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getOrdersByPrescription(prescriptionId: number): Promise<Order[]>;
  getOrdersByStatus(status: string, limit?: number, offset?: number): Promise<{ orders: Order[], total: number }>;
  getAllOrders(limit?: number, offset?: number, searchTerm?: string): Promise<{ orders: Order[], total: number }>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  
  // Order item methods
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  
  // Patient Insurance methods
  getInsurance(id: number): Promise<Insurance | undefined>;
  getInsurancesByUser(userId: number): Promise<Insurance[]>;
  createInsurance(insurance: InsertInsurance): Promise<Insurance>;
  updateInsurance(id: number, insurance: Partial<InsertInsurance>): Promise<Insurance | undefined>;
  
  // Cart methods
  getCart(userId: number): Promise<Cart | undefined>;
  createCart(cart: InsertCart): Promise<Cart>;
  updateCart(userId: number, items: CartItem[]): Promise<Cart | undefined>;
  clearCart(userId: number): Promise<boolean>;
  
  // Refill Request methods
  getRefillRequest(id: number): Promise<RefillRequest | undefined>;
  getRefillRequestsByUser(userId: number): Promise<RefillRequest[]>;
  getRefillRequestsByPrescription(prescriptionId: number): Promise<RefillRequest[]>;
  createRefillRequest(request: InsertRefillRequest): Promise<RefillRequest>;
  updateRefillRequest(id: number, request: Partial<InsertRefillRequest>): Promise<RefillRequest | undefined>;
  
  // Refill Notification methods
  getRefillNotification(id: number): Promise<RefillNotification | undefined>;
  getRefillNotificationsByUser(userId: number): Promise<RefillNotification[]>;
  getRefillNotificationsByRefillRequest(refillRequestId: number): Promise<RefillNotification[]>;
  createRefillNotification(notification: InsertRefillNotification): Promise<RefillNotification>;
  markRefillNotificationAsRead(id: number): Promise<RefillNotification | undefined>;
  
  // White Label Configuration methods
  getWhiteLabel(id: number): Promise<WhiteLabel | undefined>;
  getWhiteLabelByName(name: string): Promise<WhiteLabel | undefined>;
  getActiveWhiteLabel(): Promise<WhiteLabel | undefined>;
  getDefaultWhiteLabel(): Promise<WhiteLabel | undefined>;
  getWhiteLabels(): Promise<WhiteLabel[]>;
  createWhiteLabel(config: InsertWhiteLabel): Promise<WhiteLabel>;
  updateWhiteLabel(id: number, config: Partial<InsertWhiteLabel>): Promise<WhiteLabel | undefined>;
  activateWhiteLabel(id: number): Promise<WhiteLabel | undefined>;
  deactivateWhiteLabel(id: number): Promise<WhiteLabel | undefined>;
  setDefaultWhiteLabel(id: number): Promise<WhiteLabel | undefined>;
  unsetDefaultWhiteLabel(id: number): Promise<WhiteLabel | undefined>;
  
  // Inventory Provider methods
  getInventoryProvider(id: number): Promise<InventoryProvider | undefined>;
  getInventoryProviderByName(name: string): Promise<InventoryProvider | undefined>;
  getInventoryProviders(activeOnly?: boolean): Promise<InventoryProvider[]>;
  createInventoryProvider(provider: InsertInventoryProvider): Promise<InventoryProvider>;
  updateInventoryProvider(id: number, providerData: Partial<InsertInventoryProvider>): Promise<InventoryProvider | undefined>;
  updateInventoryProviderStatus(id: number, status: { connectionStatus: string, lastSyncDate?: Date }): Promise<InventoryProvider | undefined>;
  deleteInventoryProvider(id: number): Promise<boolean>;
  
  // Inventory Item methods
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  getInventoryItemByExternalId(providerId: number, externalId: string): Promise<InventoryItem | undefined>;
  getInventoryItemsByProvider(providerId: number): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, itemData: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  
  // Inventory Mapping methods
  getInventoryMapping(id: number): Promise<InventoryMapping | undefined>;
  getInventoryMappingByItemAndMedication(inventoryItemId: number, medicationId: number): Promise<InventoryMapping | undefined>;
  getInventoryMappingsByMedication(medicationId: number): Promise<InventoryMapping[]>;
  getInventoryMappingsByItem(inventoryItemId: number): Promise<InventoryMapping[]>;
  createInventoryMapping(mapping: InsertInventoryMapping): Promise<InventoryMapping>;
  updateInventoryMapping(id: number, mappingData: Partial<InsertInventoryMapping>): Promise<InventoryMapping | undefined>;
  deleteInventoryMapping(id: number): Promise<boolean>;
  
  // Helper method for inventory service
  getAllMedicationsSync(): Medication[];
  
  // User Medications methods
  getUserMedication(id: number): Promise<UserMedication | undefined>;
  getUserMedicationsByUser(userId: number): Promise<UserMedication[]>;
  getUserMedicationsByUserAndMedication(userId: number, medicationId: number): Promise<UserMedication | undefined>;
  getUserMedicationsByPrescription(prescriptionId: number): Promise<UserMedication[]>;
  createUserMedication(medication: InsertUserMedication): Promise<UserMedication>;
  updateUserMedication(id: number, medication: Partial<InsertUserMedication>): Promise<UserMedication | undefined>;
  toggleUserMedicationActive(id: number, active: boolean): Promise<UserMedication | undefined>;
  deleteUserMedication(id: number): Promise<boolean>;
  
  // User Medications Automatic Methods
  addUserMedicationFromOrder(userId: number, medicationId: number, source: string): Promise<UserMedication | undefined>;
  addUserMedicationFromPrescription(userId: number, medicationId: number, prescriptionId: number): Promise<UserMedication | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private medications: Map<number, Medication>;
  private categories: Map<number, Category>;
  private prescriptions: Map<number, Prescription>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem[]>;
  private insuranceProviders: Map<number, InsuranceProvider>;
  private insurances: Map<number, Insurance>;
  private carts: Map<number, Cart>;
  private refillRequests: Map<number, RefillRequest>;
  private refillNotifications: Map<number, RefillNotification>;
  // Inventory Management
  private inventoryProviders: Map<number, InventoryProvider>;
  private inventoryItems: Map<number, InventoryItem>;
  private inventoryMappings: Map<number, InventoryMapping>;
  private userMedications: Map<number, UserMedication>;
  
  public sessionStore: session.Store;
  
  private userIdCounter: number;
  private medicationIdCounter: number;
  private categoryIdCounter: number;
  private prescriptionIdCounter: number;
  private orderIdCounter: number;
  private orderItemIdCounter: number;
  private insuranceProviderIdCounter: number;
  private insuranceIdCounter: number;
  private cartIdCounter: number;
  private refillRequestIdCounter: number;
  private refillNotificationIdCounter: number;
  private whiteLabelIdCounter: number;
  // Inventory counters
  private inventoryProviderIdCounter: number;
  private inventoryItemIdCounter: number;
  private inventoryMappingIdCounter: number;
  // User Medications counter
  private userMedicationIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.medications = new Map();
    this.categories = new Map();
    this.prescriptions = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.insuranceProviders = new Map();
    this.insurances = new Map();
    this.carts = new Map();
    this.refillRequests = new Map();
    this.refillNotifications = new Map();
    this.whiteLabels = new Map();
    // Initialize inventory maps
    this.inventoryProviders = new Map();
    this.inventoryItems = new Map();
    this.inventoryMappings = new Map();
    // Initialize user medications map
    this.userMedications = new Map();
    
    // Initialize session store
    const MemoryStore = memorystore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    this.userIdCounter = 1;
    this.medicationIdCounter = 1;
    this.categoryIdCounter = 1;
    this.prescriptionIdCounter = 1;
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;
    this.insuranceProviderIdCounter = 1;
    this.insuranceIdCounter = 1;
    this.cartIdCounter = 1;
    this.refillRequestIdCounter = 1;
    this.refillNotificationIdCounter = 1;
    this.whiteLabelIdCounter = 1;
    // Initialize inventory counters
    this.inventoryProviderIdCounter = 1;
    this.inventoryItemIdCounter = 1;
    this.inventoryMappingIdCounter = 1;
    // Initialize user medications counter
    this.userMedicationIdCounter = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }
  
  private initializeSampleData() {
    // Add categories
    const categories = [
      { name: 'Heart Health', description: 'Medications for heart conditions', icon: 'favorite' },
      { name: 'Mental Health', description: 'Medications for mental health conditions', icon: 'psychology' },
      { name: 'Antibiotics', description: 'Medications to treat infections', icon: 'medical_services' },
      { name: 'Diabetes', description: 'Medications for diabetes management', icon: 'water_drop' },
      { name: 'Asthma', description: 'Medications for respiratory conditions', icon: 'air' },
      { name: 'Pain Relief', description: 'Medications for pain management', icon: 'healing' }
    ];
    
    categories.forEach(category => {
      this.createCategory(category);
    });
    
    // Add medications
    const medications = [
      {
        name: 'Atorvastatin',
        genericName: 'Atorvastatin',
        brandName: 'Lipitor',
        description: 'Atorvastatin is used to treat high cholesterol and to lower the risk of stroke, heart attack, or other heart complications.',
        uses: 'Lowers cholesterol and triglycerides in the blood',
        sideEffects: 'Mild side effects include diarrhea, upset stomach, muscle and joint pain.',
        dosage: '10mg, 20mg, 40mg, 80mg tablets',
        price: 8.70,
        retailPrice: 43.50,
        requiresPrescription: true,
        inStock: true,
        category: 'Heart Health',
        popularity: 95
      },
      {
        name: 'Lisinopril',
        genericName: 'Lisinopril',
        brandName: 'Prinivil',
        description: 'Lisinopril is used to treat high blood pressure and heart failure.',
        uses: 'Treats high blood pressure and heart failure',
        sideEffects: 'Dry cough, dizziness, headache, and tiredness may occur.',
        dosage: '5mg, 10mg, 20mg, 40mg tablets',
        price: 4.80,
        retailPrice: 24.00,
        requiresPrescription: true,
        inStock: true,
        category: 'Heart Health',
        popularity: 90
      },
      {
        name: 'Metformin',
        genericName: 'Metformin',
        brandName: 'Glucophage',
        description: 'Metformin is used to treat type 2 diabetes.',
        uses: 'Controls blood sugar levels in type 2 diabetes',
        sideEffects: 'Nausea, vomiting, stomach upset, diarrhea, weakness, or a metallic taste may occur.',
        dosage: '500mg, 850mg, 1000mg tablets',
        price: 3.99,
        retailPrice: 19.95,
        requiresPrescription: true,
        inStock: true,
        category: 'Diabetes',
        popularity: 85
      },
      {
        name: 'Sertraline',
        genericName: 'Sertraline',
        brandName: 'Zoloft',
        description: 'Sertraline is used to treat depression, panic attacks, and anxiety.',
        uses: 'Treats depression, anxiety, and panic attacks',
        sideEffects: 'Nausea, diarrhea, tremor, insomnia, drowsiness, dizziness, dry mouth.',
        dosage: '25mg, 50mg, 100mg tablets',
        price: 6.50,
        retailPrice: 32.50,
        requiresPrescription: true,
        inStock: true,
        category: 'Mental Health',
        popularity: 80
      },
      {
        name: 'Amoxicillin',
        genericName: 'Amoxicillin',
        brandName: 'Amoxil',
        description: 'Amoxicillin is a penicillin antibiotic that fights bacteria.',
        uses: 'Treats bacterial infections such as bronchitis, pneumonia, and infections of the ear, nose, throat, skin, or urinary tract',
        sideEffects: 'Diarrhea, nausea, vomiting, or rash may occur.',
        dosage: '250mg, 500mg capsules',
        price: 5.20,
        retailPrice: 26.00,
        requiresPrescription: true,
        inStock: true,
        category: 'Antibiotics',
        popularity: 75
      },
      {
        name: 'Albuterol',
        genericName: 'Albuterol',
        brandName: 'Ventolin',
        description: 'Albuterol is used to treat or prevent bronchospasm in people with asthma or certain other airway diseases.',
        uses: 'Prevents and treats wheezing, difficulty breathing, chest tightness, and coughing caused by lung diseases such as asthma',
        sideEffects: 'Nervousness, shaking, headache, throat irritation, nausea, or dizziness may occur.',
        dosage: '2mg, 4mg tablets; 90mcg inhaler',
        price: 12.99,
        retailPrice: 64.95,
        requiresPrescription: true,
        inStock: true,
        category: 'Asthma',
        popularity: 70
      }
    ];
    
    medications.forEach(medication => {
      this.createMedication(medication);
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    // Make comparison case-insensitive
    return Array.from(this.users.values()).find(
      user => user.username && user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    // Make comparison case-insensitive
    return Array.from(this.users.values()).find(
      user => user.email && user.email.toLowerCase() === email.toLowerCase()
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Ensure all nullable fields have values
    const newUser: User = { 
      ...user, 
      id,
      username: user.username ?? null,
      password: user.password,
      email: user.email,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      phone: user.phone ?? null,
      address: user.address ?? null,
      city: user.city ?? null,
      state: user.state ?? null,
      zipCode: user.zipCode ?? null,
      billingAddress: user.billingAddress ?? null,
      billingCity: user.billingCity ?? null,
      billingState: user.billingState ?? null,
      billingZipCode: user.billingZipCode ?? null,
      sameAsShipping: user.sameAsShipping ?? true,
      dateOfBirth: user.dateOfBirth ?? null,
      sexAtBirth: user.sexAtBirth ?? null,
      profileCompleted: user.profileCompleted ?? false,
      role: user.role || "user",
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUserRole(id: number, role: string): Promise<boolean> {
    const user = await this.getUser(id);
    if (!user) return false;
    
    // Validate role
    if (!['user', 'call_center', 'pharmacist', 'admin'].includes(role)) {
      return false;
    }
    
    // Update user role
    user.role = role;
    this.users.set(id, user);
    return true;
  }
  
  // Password reset methods
  async storePasswordResetToken(userId: number, token: string, expiry: Date): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    const updatedUser: User = {
      ...user,
      resetToken: token,
      resetTokenExpiry: expiry
    };
    
    this.users.set(userId, updatedUser);
    return true;
  }
  
  async getUserByResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => 
      user.resetToken === token && 
      user.resetTokenExpiry && 
      new Date(user.resetTokenExpiry) > new Date()
    );
  }
  
  async resetPassword(userId: number, newPassword: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;
    
    const updatedUser: User = {
      ...user,
      password: newPassword,
      resetToken: null,
      resetTokenExpiry: null
    };
    
    this.users.set(userId, updatedUser);
    return true;
  }
  

  // Medication methods
  async getMedication(id: number): Promise<Medication | undefined> {
    return this.medications.get(id);
  }
  
  async getMedications(limit = 100, offset = 0): Promise<Medication[]> {
    const allMedications = Array.from(this.medications.values());
    return allMedications.slice(offset, offset + limit);
  }
  
  async getMedicationsByCategory(category: string): Promise<Medication[]> {
    return Array.from(this.medications.values()).filter(med => med.category === category);
  }
  
  async searchMedications(query: string): Promise<Medication[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.medications.values()).filter(med => 
      med.name.toLowerCase().includes(lowerQuery) || 
      (med.genericName && med.genericName.toLowerCase().includes(lowerQuery)) ||
      (med.brandName && med.brandName.toLowerCase().includes(lowerQuery))
    );
  }
  
  async getPopularMedications(limit: number): Promise<Medication[]> {
    return Array.from(this.medications.values())
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, limit);
  }
  
  async createMedication(medication: InsertMedication): Promise<Medication> {
    const id = this.medicationIdCounter++;
    // Ensure all nullable fields have values
    const newMedication: Medication = { 
      ...medication, 
      id,
      genericName: medication.genericName ?? null,
      brandName: medication.brandName ?? null,
      description: medication.description ?? null,
      uses: medication.uses ?? null,
      sideEffects: medication.sideEffects ?? null,
      dosage: medication.dosage ?? null,
      retailPrice: medication.retailPrice ?? null,
      requiresPrescription: medication.requiresPrescription ?? null,
      inStock: medication.inStock ?? null,
      category: medication.category ?? null,
      imageUrl: medication.imageUrl ?? null,
      popularity: medication.popularity ?? null
    };
    this.medications.set(id, newMedication);
    return newMedication;
  }
  
  async updateMedication(id: number, medicationData: Partial<InsertMedication>): Promise<Medication | undefined> {
    const medication = await this.getMedication(id);
    if (!medication) return undefined;
    
    const updatedMedication: Medication = { ...medication, ...medicationData };
    this.medications.set(id, updatedMedication);
    return updatedMedication;
  }
  
  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoryByName(name: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(category => category.name === name);
  }
  
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const newCategory: Category = { 
      ...category, 
      id,
      description: category.description ?? null,
      icon: category.icon ?? null
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory: Category = {
      ...category,
      ...categoryData,
      description: categoryData.description ?? category.description,
      icon: categoryData.icon ?? category.icon
    };
    
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  // Prescription methods
  async getPrescription(id: number): Promise<Prescription | undefined> {
    const prescription = this.prescriptions.get(id);
    
    if (prescription) {
      // Add verificationStatus field if missing based on other fields
      if (prescription.verificationStatus === undefined) {
        prescription.verificationStatus = prescription.verifiedBy ? "verified" : "unverified";
      }
    }
    
    return prescription;
  }
  
  async getPrescriptionsByUser(userId: number): Promise<Prescription[]> {
    const prescriptions = Array.from(this.prescriptions.values())
      .filter(prescription => prescription.userId === userId)
      .map(prescription => {
        // Add verificationStatus field if missing based on other fields
        if (prescription.verificationStatus === undefined) {
          prescription.verificationStatus = prescription.verifiedBy ? "verified" : "unverified";
        }
        return prescription;
      });
    
    return prescriptions;
  }
  
  async getPrescriptionsForVerification(status?: string, limit = 20, offset = 0): Promise<Prescription[]> {
    let prescriptions = Array.from(this.prescriptions.values())
      .map(prescription => {
        // Add verificationStatus field if missing based on other fields
        if (prescription.verificationStatus === undefined) {
          prescription.verificationStatus = prescription.verifiedBy ? "verified" : "unverified";
        }
        return prescription;
      });
    
    if (status) {
      // Filter by status if provided
      prescriptions = prescriptions.filter(prescription => prescription.status === status);
    } else {
      // Default to showing pending prescriptions
      prescriptions = prescriptions.filter(prescription => prescription.status === "pending");
    }
    
    // Sort by upload date, newest first
    prescriptions.sort((a, b) => {
      const dateA = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
      const dateB = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
      return dateB - dateA;
    });
    
    return prescriptions.slice(offset, offset + limit);
  }
  
  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const id = this.prescriptionIdCounter++;
    const now = new Date();
    const securityCode = this.generateRandomSecurityCode();
    
    const newPrescription: Prescription = { 
      ...prescription, 
      id, 
      uploadDate: now,
      status: prescription.status ?? 'pending',
      doctorName: prescription.doctorName ?? null,
      doctorPhone: prescription.doctorPhone ?? null,
      fileUrl: prescription.fileUrl ?? null,
      notes: prescription.notes ?? null,
      // Added default values for verification fields
      verifiedBy: null,
      verificationDate: null,
      verificationMethod: null,
      verificationNotes: null,
      verificationStatus: "unverified", // Set default verification status
      expirationDate: null,
      securityCode,
      revoked: false,
      revokedReason: null
    };
    this.prescriptions.set(id, newPrescription);
    return newPrescription;
  }
  
  async updatePrescription(id: number, prescriptionData: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const prescription = await this.getPrescription(id);
    if (!prescription) return undefined;
    
    const updatedPrescription: Prescription = { ...prescription, ...prescriptionData };
    this.prescriptions.set(id, updatedPrescription);
    return updatedPrescription;
  }
  
  // Helper method to generate a random security code
  private generateRandomSecurityCode(): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters like 0, O, 1, I
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }
  
  // Prescription verification methods
  async verifyPrescription(id: number, verifierId: number, verificationData: {
    status: string,
    verificationMethod: string,
    verificationNotes?: string,
    expirationDate?: Date
  }): Promise<Prescription | undefined> {
    const prescription = await this.getPrescription(id);
    if (!prescription) return undefined;
    
    const now = new Date();
    // Calculate default expiration date (1 year from verification)
    const defaultExpirationDate = new Date();
    defaultExpirationDate.setFullYear(defaultExpirationDate.getFullYear() + 1);
    
    const updatedPrescription: Prescription = { 
      ...prescription,
      verifiedBy: verifierId,
      verificationDate: now,
      verificationMethod: verificationData.verificationMethod,
      verificationNotes: verificationData.verificationNotes ?? null,
      verificationStatus: "verified", // Set verification status to verified
      expirationDate: verificationData.expirationDate ?? defaultExpirationDate,
      // Update the status
      status: verificationData.status
    };
    
    this.prescriptions.set(id, updatedPrescription);
    return updatedPrescription;
  }
  
  async revokePrescription(id: number, reason: string): Promise<Prescription | undefined> {
    const prescription = await this.getPrescription(id);
    if (!prescription) return undefined;
    
    const updatedPrescription: Prescription = { 
      ...prescription,
      revoked: true,
      revokedReason: reason,
      verificationStatus: "failed", // Mark verification as failed
      status: 'rejected' // Update the main status as well
    };
    
    this.prescriptions.set(id, updatedPrescription);
    return updatedPrescription;
  }
  
  async generateSecurityCode(prescriptionId: number): Promise<string> {
    const prescription = await this.getPrescription(prescriptionId);
    if (!prescription) throw new Error("Prescription not found");
    
    // Generate a new security code
    const securityCode = this.generateRandomSecurityCode();
    
    // Update the prescription with the new code
    prescription.securityCode = securityCode;
    this.prescriptions.set(prescriptionId, prescription);
    
    return securityCode;
  }
  
  async validatePrescriptionForMedication(prescriptionId: number, medicationId: number): Promise<{
    valid: boolean,
    reason?: string
  }> {
    const prescription = await this.getPrescription(prescriptionId);
    if (!prescription) {
      return { valid: false, reason: "Prescription not found" };
    }
    
    // Check if prescription is approved
    if (prescription.status !== "approved") {
      return { valid: false, reason: "Prescription has not been approved" };
    }
    
    // Check if prescription is revoked
    if (prescription.revoked) {
      return { valid: false, reason: "Prescription has been revoked: " + prescription.revokedReason };
    }
    
    // Check if prescription is expired
    if (prescription.expirationDate && new Date() > new Date(prescription.expirationDate)) {
      return { valid: false, reason: "Prescription has expired" };
    }
    
    // Verify the medication is appropriate for this prescription
    // In a real system, this would check the medications listed in the prescription
    // For this demo, we'll consider all medications valid for any verified prescription
    
    return { valid: true };
  }
  
  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async getOrdersByUser(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => {
        const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
        const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
        return dateB - dateA;
      });
  }
  
  async getOrdersByPrescription(prescriptionId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.prescriptionId === prescriptionId)
      .sort((a, b) => {
        const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
        const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
        return dateB - dateA; // Sort by newest first
      });
  }
  
  async getOrdersByStatus(status: string, limit: number = 20, offset: number = 0): Promise<{ orders: Order[], total: number }> {
    const filteredOrders = Array.from(this.orders.values())
      .filter(order => status === 'all' ? true : order.status === status)
      .sort((a, b) => {
        const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
        const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
        return dateB - dateA; // Sort by newest first
      });
    
    return {
      orders: filteredOrders.slice(offset, offset + limit),
      total: filteredOrders.length
    };
  }
  
  async getAllOrders(limit: number = 20, offset: number = 0, searchTerm: string = ''): Promise<{ orders: Order[], total: number }> {
    let filteredOrders = Array.from(this.orders.values());
    
    // Sort by newest first
    filteredOrders = filteredOrders.sort((a, b) => {
      const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
      const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
      return dateB - dateA;
    });
    
    // Apply search term if provided
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      
      // Get all users for searching by user properties
      const allUsers = Array.from(this.users.values());
      
      filteredOrders = filteredOrders.filter(order => {
        // Search by order ID
        if (order.id.toString().includes(lowerCaseSearch)) return true;
        
        // Search by order status
        if (order.status.toLowerCase().includes(lowerCaseSearch)) return true;
        
        // Search by tracking number
        if (order.trackingNumber && order.trackingNumber.toLowerCase().includes(lowerCaseSearch)) return true;
        
        // Get user associated with this order
        const orderUser = allUsers.find(user => user.id === order.userId);
        if (orderUser) {
          // Search by user email
          if (orderUser.email && orderUser.email.toLowerCase().includes(lowerCaseSearch)) return true;
          
          // Search by user name
          if (orderUser.firstName && orderUser.firstName.toLowerCase().includes(lowerCaseSearch)) return true;
          if (orderUser.lastName && orderUser.lastName.toLowerCase().includes(lowerCaseSearch)) return true;
          
          // Search by phone
          if (orderUser.phone && orderUser.phone.toLowerCase().includes(lowerCaseSearch)) return true;
        }
        
        return false;
      });
    }
    
    return {
      orders: filteredOrders.slice(offset, offset + limit),
      total: filteredOrders.length
    };
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const now = new Date();
    const newOrder: Order = { 
      ...order, 
      id, 
      orderDate: now,
      status: order.status ?? 'pending',
      shippingAddress: order.shippingAddress ?? null,
      trackingNumber: order.trackingNumber ?? null,
      carrier: order.carrier ?? null,
      prescriptionId: order.prescriptionId ?? null
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }
  
  async updateOrder(id: number, orderData: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;
    
    const updatedOrder: Order = { ...order, ...orderData };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  // Order item methods
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return this.orderItems.get(orderId) || [];
  }
  
  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.orderItemIdCounter++;
    const newOrderItem: OrderItem = { ...orderItem, id };
    
    const existingItems = this.orderItems.get(orderItem.orderId) || [];
    this.orderItems.set(orderItem.orderId, [...existingItems, newOrderItem]);
    
    return newOrderItem;
  }
  
  // Insurance Provider methods
  async getInsuranceProvider(id: number): Promise<InsuranceProvider | undefined> {
    return this.insuranceProviders.get(id);
  }
  
  async getInsuranceProviderByName(name: string): Promise<InsuranceProvider | undefined> {
    return Array.from(this.insuranceProviders.values()).find(provider => provider.name === name);
  }
  
  async getInsuranceProviders(activeOnly = false): Promise<InsuranceProvider[]> {
    const providers = Array.from(this.insuranceProviders.values());
    
    if (activeOnly) {
      return providers.filter(provider => provider.isActive);
    }
    
    return providers;
  }
  
  async createInsuranceProvider(provider: InsertInsuranceProvider): Promise<InsuranceProvider> {
    const id = this.insuranceProviderIdCounter++;
    const now = new Date();
    
    const newProvider: InsuranceProvider = {
      ...provider,
      id,
      description: provider.description ?? null,
      contactPhone: provider.contactPhone ?? null,
      contactEmail: provider.contactEmail ?? null,
      website: provider.website ?? null,
      formularyUrl: provider.formularyUrl ?? null,
      isActive: provider.isActive ?? true,
      logoUrl: provider.logoUrl ?? null,
      createdAt: now,
      updatedAt: now
    };
    
    this.insuranceProviders.set(id, newProvider);
    return newProvider;
  }
  
  async updateInsuranceProvider(id: number, providerData: Partial<InsertInsuranceProvider>): Promise<InsuranceProvider | undefined> {
    const provider = await this.getInsuranceProvider(id);
    if (!provider) return undefined;
    
    const now = new Date();
    const updatedProvider: InsuranceProvider = { 
      ...provider, 
      ...providerData,
      updatedAt: now
    };
    
    this.insuranceProviders.set(id, updatedProvider);
    return updatedProvider;
  }
  
  async deleteInsuranceProvider(id: number): Promise<boolean> {
    const exists = this.insuranceProviders.has(id);
    if (exists) {
      this.insuranceProviders.delete(id);
      return true;
    }
    return false;
  }
  
  // Patient Insurance methods
  async getInsurance(id: number): Promise<Insurance | undefined> {
    return this.insurances.get(id);
  }
  
  async getInsurancesByUser(userId: number): Promise<Insurance[]> {
    return Array.from(this.insurances.values()).filter(insurance => insurance.userId === userId);
  }
  
  async createInsurance(insurance: InsertInsurance): Promise<Insurance> {
    const id = this.insuranceIdCounter++;
    const newInsurance: Insurance = { 
      ...insurance, 
      id,
      userId: insurance.userId,
      provider: insurance.provider,
      memberId: insurance.memberId,
      groupNumber: insurance.groupNumber ?? null,
      phoneNumber: insurance.phoneNumber ?? null,
      isPrimary: insurance.isPrimary ?? null
    };
    this.insurances.set(id, newInsurance);
    return newInsurance;
  }
  
  async updateInsurance(id: number, insuranceData: Partial<InsertInsurance>): Promise<Insurance | undefined> {
    const insurance = await this.getInsurance(id);
    if (!insurance) return undefined;
    
    const updatedInsurance: Insurance = { ...insurance, ...insuranceData };
    this.insurances.set(id, updatedInsurance);
    return updatedInsurance;
  }
  
  // Cart methods
  async getCart(userId: number): Promise<Cart | undefined> {
    return Array.from(this.carts.values()).find(cart => cart.userId === userId);
  }
  
  async createCart(cartData: InsertCart): Promise<Cart> {
    const id = this.cartIdCounter++;
    const now = new Date();
    
    // Ensure items is treated as an array of CartItem objects
    const items: CartItem[] = Array.isArray(cartData.items) 
      ? cartData.items.map((item: any) => ({
          medicationId: Number(item.medicationId),
          quantity: Number(item.quantity),
          name: String(item.name || ''),
          price: Number(item.price),
          requiresPrescription: Boolean(item.requiresPrescription)
        }))
      : [];
    
    const newCart: Cart = { 
      ...cartData, 
      id, 
      createdAt: now,
      updatedAt: now,
      items
    };
    this.carts.set(id, newCart);
    return newCart;
  }
  
  async updateCart(userId: number, items: CartItem[]): Promise<Cart | undefined> {
    // Ensure items is a proper array of CartItem objects
    const itemsArray: CartItem[] = Array.isArray(items) 
      ? items.map((item: any) => ({
          medicationId: Number(item.medicationId),
          quantity: Number(item.quantity),
          name: String(item.name || ''),
          price: Number(item.price),
          requiresPrescription: Boolean(item.requiresPrescription)
        }))
      : [];
    
    let cart = await this.getCart(userId);
    
    if (!cart) {
      // Create new cart if it doesn't exist
      cart = await this.createCart({ userId, items: itemsArray });
      return cart;
    }
    
    // Update existing cart
    const now = new Date();
    const updatedCart: Cart = { 
      ...cart, 
      items: itemsArray,
      updatedAt: now
    };
    
    this.carts.set(cart.id, updatedCart);
    return updatedCart;
  }
  
  async clearCart(userId: number): Promise<boolean> {
    const cart = await this.getCart(userId);
    if (!cart) {
      return true; // Cart already doesn't exist
    }
    
    // Update the cart with an empty items array
    const now = new Date();
    const updatedCart: Cart = { 
      ...cart, 
      items: [],
      updatedAt: now
    };
    
    this.carts.set(cart.id, updatedCart);
    return true;
  }

  // Refill Request methods
  async getRefillRequest(id: number): Promise<RefillRequest | undefined> {
    return this.refillRequests.get(id);
  }

  async getRefillRequestsByUser(userId: number): Promise<RefillRequest[]> {
    return Array.from(this.refillRequests.values())
      .filter(request => request.userId === userId)
      .sort((a, b) => {
        const dateA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
        const dateB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
        return dateB - dateA; // Sort by newest first
      });
  }

  async getRefillRequestsByPrescription(prescriptionId: number): Promise<RefillRequest[]> {
    return Array.from(this.refillRequests.values())
      .filter(request => request.prescriptionId === prescriptionId)
      .sort((a, b) => {
        const dateA = a.requestDate ? new Date(a.requestDate).getTime() : 0;
        const dateB = b.requestDate ? new Date(b.requestDate).getTime() : 0;
        return dateB - dateA; // Sort by newest first
      });
  }

  async createRefillRequest(request: InsertRefillRequest): Promise<RefillRequest> {
    const id = this.refillRequestIdCounter++;
    const now = new Date();
    const newRefillRequest: RefillRequest = {
      id,
      userId: request.userId,
      medicationId: request.medicationId,
      prescriptionId: request.prescriptionId ?? null,
      requestDate: now,
      status: 'pending',
      quantity: request.quantity ?? 1,
      notes: request.notes ?? null,
      lastFilledDate: request.lastFilledDate ?? null,
      nextRefillDate: request.nextRefillDate ?? null,
      timesRefilled: request.timesRefilled ?? 0,
      refillsRemaining: request.refillsRemaining ?? null,
      refillsAuthorized: request.refillsAuthorized ?? null,
      autoRefill: request.autoRefill ?? false
    };
    this.refillRequests.set(id, newRefillRequest);
    return newRefillRequest;
  }

  async updateRefillRequest(id: number, requestData: Partial<InsertRefillRequest>): Promise<RefillRequest | undefined> {
    const request = await this.getRefillRequest(id);
    if (!request) return undefined;
    
    const updatedRequest: RefillRequest = { ...request, ...requestData };
    this.refillRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  // Refill Notification methods
  async getRefillNotification(id: number): Promise<RefillNotification | undefined> {
    return this.refillNotifications.get(id);
  }

  async getRefillNotificationsByUser(userId: number): Promise<RefillNotification[]> {
    return Array.from(this.refillNotifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => {
        const dateA = a.sentDate ? new Date(a.sentDate).getTime() : 0;
        const dateB = b.sentDate ? new Date(b.sentDate).getTime() : 0;
        return dateB - dateA; // Sort by newest first
      });
  }

  async getRefillNotificationsByRefillRequest(refillRequestId: number): Promise<RefillNotification[]> {
    return Array.from(this.refillNotifications.values())
      .filter(notification => notification.refillRequestId === refillRequestId)
      .sort((a, b) => {
        const dateA = a.sentDate ? new Date(a.sentDate).getTime() : 0;
        const dateB = b.sentDate ? new Date(b.sentDate).getTime() : 0;
        return dateB - dateA; // Sort by newest first
      });
  }

  async createRefillNotification(notification: InsertRefillNotification): Promise<RefillNotification> {
    const id = this.refillNotificationIdCounter++;
    const now = new Date();
    const newNotification: RefillNotification = {
      id,
      message: notification.message,
      userId: notification.userId,
      refillRequestId: notification.refillRequestId ?? null,
      sentDate: now,
      read: false,
      notificationType: notification.notificationType
    };
    this.refillNotifications.set(id, newNotification);
    return newNotification;
  }

  async markRefillNotificationAsRead(id: number): Promise<RefillNotification | undefined> {
    const notification = await this.getRefillNotification(id);
    if (!notification) return undefined;
    
    const updatedNotification: RefillNotification = { ...notification, read: true };
    this.refillNotifications.set(id, updatedNotification);
    return updatedNotification;
  }
  
  // White Label Configuration methods
  private whiteLabels: Map<number, WhiteLabel> = new Map();
  private whiteLabelIdCounter: number = 1;
  
  async getWhiteLabel(id: number): Promise<WhiteLabel | undefined> {
    return this.whiteLabels.get(id);
  }
  
  async getWhiteLabelByName(name: string): Promise<WhiteLabel | undefined> {
    return Array.from(this.whiteLabels.values()).find(config => config.name === name);
  }
  
  async getActiveWhiteLabel(): Promise<WhiteLabel | undefined> {
    return Array.from(this.whiteLabels.values()).find(config => config.isActive);
  }
  
  async getDefaultWhiteLabel(): Promise<WhiteLabel | undefined> {
    return Array.from(this.whiteLabels.values()).find(config => config.isDefault);
  }
  
  async getWhiteLabels(): Promise<WhiteLabel[]> {
    return Array.from(this.whiteLabels.values());
  }
  
  async createWhiteLabel(config: InsertWhiteLabel): Promise<WhiteLabel> {
    const id = this.whiteLabelIdCounter++;
    const now = new Date();
    
    const newWhiteLabel: WhiteLabel = {
      ...config,
      id,
      createdAt: now,
      updatedAt: now,
      logo: config.logo ?? null,
      primaryColor: config.primaryColor ?? "#3b82f6",
      secondaryColor: config.secondaryColor ?? "#10b981",
      accentColor: config.accentColor ?? "#f59e0b",
      fontFamily: config.fontFamily ?? "Inter",
      customCss: config.customCss ?? null,
      favicon: config.favicon ?? null,
      contactPhone: config.contactPhone ?? null,
      address: config.address ?? null,
      customFooter: config.customFooter ?? null,
      customHeader: config.customHeader ?? null,
      termsUrl: config.termsUrl ?? null,
      privacyUrl: config.privacyUrl ?? null,
      isActive: config.isActive ?? false
    };
    
    this.whiteLabels.set(id, newWhiteLabel);
    return newWhiteLabel;
  }
  
  async updateWhiteLabel(id: number, config: Partial<InsertWhiteLabel>): Promise<WhiteLabel | undefined> {
    const whiteLabel = await this.getWhiteLabel(id);
    if (!whiteLabel) return undefined;
    
    const updatedWhiteLabel: WhiteLabel = { 
      ...whiteLabel, 
      ...config,
      updatedAt: new Date()
    };
    
    this.whiteLabels.set(id, updatedWhiteLabel);
    return updatedWhiteLabel;
  }
  
  async activateWhiteLabel(id: number): Promise<WhiteLabel | undefined> {
    // First deactivate any active white label
    const currentActiveConfig = await this.getActiveWhiteLabel();
    if (currentActiveConfig) {
      currentActiveConfig.isActive = false;
      this.whiteLabels.set(currentActiveConfig.id, currentActiveConfig);
    }
    
    // Now activate the requested white label
    const whiteLabel = await this.getWhiteLabel(id);
    if (!whiteLabel) return undefined;
    
    const updatedWhiteLabel: WhiteLabel = { 
      ...whiteLabel, 
      isActive: true,
      updatedAt: new Date()
    };
    
    this.whiteLabels.set(id, updatedWhiteLabel);
    return updatedWhiteLabel;
  }
  
  async deactivateWhiteLabel(id: number): Promise<WhiteLabel | undefined> {
    const whiteLabel = await this.getWhiteLabel(id);
    if (!whiteLabel) return undefined;
    
    const updatedWhiteLabel: WhiteLabel = { 
      ...whiteLabel, 
      isActive: false,
      updatedAt: new Date()
    };
    
    this.whiteLabels.set(id, updatedWhiteLabel);
    return updatedWhiteLabel;
  }
  
  async setDefaultWhiteLabel(id: number): Promise<WhiteLabel | undefined> {
    // First clear any existing default white label
    const currentDefault = await this.getDefaultWhiteLabel();
    if (currentDefault) {
      currentDefault.isDefault = false;
      this.whiteLabels.set(currentDefault.id, currentDefault);
    }
    
    // Now set the requested white label as default
    const whiteLabel = await this.getWhiteLabel(id);
    if (!whiteLabel) return undefined;
    
    const updatedWhiteLabel: WhiteLabel = { 
      ...whiteLabel, 
      isDefault: true,
      updatedAt: new Date()
    };
    
    this.whiteLabels.set(id, updatedWhiteLabel);
    return updatedWhiteLabel;
  }
  
  async unsetDefaultWhiteLabel(id: number): Promise<WhiteLabel | undefined> {
    const whiteLabel = await this.getWhiteLabel(id);
    if (!whiteLabel) return undefined;
    
    const updatedWhiteLabel: WhiteLabel = { 
      ...whiteLabel, 
      isDefault: false,
      updatedAt: new Date()
    };
    
    this.whiteLabels.set(id, updatedWhiteLabel);
    return updatedWhiteLabel;
  }

  // Inventory Provider methods
  async getInventoryProvider(id: number): Promise<InventoryProvider | undefined> {
    return this.inventoryProviders.get(id);
  }
  
  async getInventoryProviderByName(name: string): Promise<InventoryProvider | undefined> {
    return Array.from(this.inventoryProviders.values()).find(provider => provider.name === name);
  }
  
  async getInventoryProviders(activeOnly = false): Promise<InventoryProvider[]> {
    let providers = Array.from(this.inventoryProviders.values());
    if (activeOnly) {
      providers = providers.filter(provider => provider.isActive);
    }
    return providers;
  }
  
  async createInventoryProvider(provider: InsertInventoryProvider): Promise<InventoryProvider> {
    const id = this.inventoryProviderIdCounter++;
    const now = new Date();
    const newProvider: InventoryProvider = {
      ...provider,
      id,
      apiKey: provider.apiKey ?? null,
      apiSecret: provider.apiSecret ?? null,
      description: provider.description ?? null,
      isActive: provider.isActive ?? true,
      connectionStatus: provider.connectionStatus ?? 'disconnected',
      lastSyncDate: provider.lastSyncDate ?? null,
      syncFrequency: provider.syncFrequency ?? 'daily',
      syncSchedule: provider.syncSchedule ?? null,
      createdAt: now,
      updatedAt: now
    };
    this.inventoryProviders.set(id, newProvider);
    return newProvider;
  }
  
  async updateInventoryProvider(id: number, providerData: Partial<InsertInventoryProvider>): Promise<InventoryProvider | undefined> {
    const provider = await this.getInventoryProvider(id);
    if (!provider) return undefined;
    
    const updatedProvider: InventoryProvider = { 
      ...provider, 
      ...providerData,
      updatedAt: new Date()
    };
    this.inventoryProviders.set(id, updatedProvider);
    return updatedProvider;
  }
  
  async updateInventoryProviderStatus(id: number, status: { connectionStatus: string, lastSyncDate?: Date }): Promise<InventoryProvider | undefined> {
    const provider = await this.getInventoryProvider(id);
    if (!provider) return undefined;
    
    const updatedProvider: InventoryProvider = { 
      ...provider, 
      connectionStatus: status.connectionStatus,
      lastSyncDate: status.lastSyncDate ?? provider.lastSyncDate,
      updatedAt: new Date()
    };
    this.inventoryProviders.set(id, updatedProvider);
    return updatedProvider;
  }
  
  async deleteInventoryProvider(id: number): Promise<boolean> {
    // First, delete all associated inventory items and their mappings
    const items = await this.getInventoryItemsByProvider(id);
    for (const item of items) {
      const mappings = await this.getInventoryMappingsByItem(item.id);
      for (const mapping of mappings) {
        await this.deleteInventoryMapping(mapping.id);
      }
      await this.deleteInventoryItem(item.id);
    }
    
    return this.inventoryProviders.delete(id);
  }
  
  // Inventory Item methods
  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }
  
  async getInventoryItemByExternalId(providerId: number, externalId: string): Promise<InventoryItem | undefined> {
    return Array.from(this.inventoryItems.values()).find(
      item => item.providerId === providerId && item.externalId === externalId
    );
  }
  
  async getInventoryItemsByProvider(providerId: number): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values()).filter(item => item.providerId === providerId);
  }
  
  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const id = this.inventoryItemIdCounter++;
    const newItem: InventoryItem = {
      ...item,
      id,
      externalNdc: item.externalNdc ?? null,
      description: item.description ?? null,
      inStock: item.inStock ?? true,
      quantity: item.quantity ?? 0,
      unit: item.unit ?? null,
      price: item.price ?? null,
      wholesalePrice: item.wholesalePrice ?? null,
      retailPrice: item.retailPrice ?? null,
      location: item.location ?? null,
      expirationDate: item.expirationDate ?? null,
      reorderPoint: item.reorderPoint ?? null,
      reorderQuantity: item.reorderQuantity ?? null,
      supplierInfo: item.supplierInfo ?? null,
      rawData: item.rawData ?? null
    };
    this.inventoryItems.set(id, newItem);
    return newItem;
  }
  
  async updateInventoryItem(id: number, itemData: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const item = await this.getInventoryItem(id);
    if (!item) return undefined;
    
    const updatedItem: InventoryItem = { ...item, ...itemData };
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteInventoryItem(id: number): Promise<boolean> {
    // First, delete all mappings associated with this item
    const mappings = await this.getInventoryMappingsByItem(id);
    for (const mapping of mappings) {
      await this.deleteInventoryMapping(mapping.id);
    }
    
    return this.inventoryItems.delete(id);
  }
  
  // Inventory Mapping methods
  async getInventoryMapping(id: number): Promise<InventoryMapping | undefined> {
    return this.inventoryMappings.get(id);
  }
  
  async getInventoryMappingByItemAndMedication(inventoryItemId: number, medicationId: number): Promise<InventoryMapping | undefined> {
    return Array.from(this.inventoryMappings.values()).find(
      mapping => mapping.inventoryItemId === inventoryItemId && mapping.medicationId === medicationId
    );
  }
  
  async getInventoryMappingsByMedication(medicationId: number): Promise<InventoryMapping[]> {
    return Array.from(this.inventoryMappings.values()).filter(
      mapping => mapping.medicationId === medicationId
    );
  }
  
  async getInventoryMappingsByItem(inventoryItemId: number): Promise<InventoryMapping[]> {
    return Array.from(this.inventoryMappings.values()).filter(
      mapping => mapping.inventoryItemId === inventoryItemId
    );
  }
  
  async createInventoryMapping(mapping: InsertInventoryMapping): Promise<InventoryMapping> {
    const id = this.inventoryMappingIdCounter++;
    const now = new Date();
    
    // If this is set as primary, set all other mappings for this medication to non-primary
    if (mapping.isPrimary) {
      const existingMappings = await this.getInventoryMappingsByMedication(mapping.medicationId);
      for (const existingMapping of existingMappings) {
        if (existingMapping.isPrimary) {
          const updatedMapping = { ...existingMapping, isPrimary: false };
          this.inventoryMappings.set(existingMapping.id, updatedMapping);
        }
      }
    }
    
    const newMapping: InventoryMapping = {
      ...mapping,
      id,
      isPrimary: mapping.isPrimary ?? false,
      mappingType: mapping.mappingType ?? 'automatic',
      mappingStatus: mapping.mappingStatus ?? 'active',
      mappingConfidence: mapping.mappingConfidence ?? null,
      createdAt: now,
      updatedAt: now
    };
    this.inventoryMappings.set(id, newMapping);
    return newMapping;
  }
  
  async updateInventoryMapping(id: number, mappingData: Partial<InsertInventoryMapping>): Promise<InventoryMapping | undefined> {
    const mapping = await this.getInventoryMapping(id);
    if (!mapping) return undefined;
    
    // If updating to primary, set all other mappings for this medication to non-primary
    if (mappingData.isPrimary && !mapping.isPrimary) {
      const existingMappings = await this.getInventoryMappingsByMedication(mapping.medicationId);
      for (const existingMapping of existingMappings) {
        if (existingMapping.id !== id && existingMapping.isPrimary) {
          const updatedMapping = { ...existingMapping, isPrimary: false };
          this.inventoryMappings.set(existingMapping.id, updatedMapping);
        }
      }
    }
    
    const updatedMapping: InventoryMapping = { 
      ...mapping, 
      ...mappingData,
      updatedAt: new Date()
    };
    this.inventoryMappings.set(id, updatedMapping);
    return updatedMapping;
  }
  
  async deleteInventoryMapping(id: number): Promise<boolean> {
    return this.inventoryMappings.delete(id);
  }
  
  // Helper method for inventory service
  getAllMedicationsSync(): Medication[] {
    return Array.from(this.medications.values());
  }

  // User Medications methods
  async getUserMedication(id: number): Promise<UserMedication | undefined> {
    return this.userMedications.get(id);
  }

  async getUserMedicationsByUser(userId: number): Promise<UserMedication[]> {
    return Array.from(this.userMedications.values())
      .filter(userMed => userMed.userId === userId);
  }

  async getUserMedicationsByUserAndMedication(userId: number, medicationId: number): Promise<UserMedication | undefined> {
    return Array.from(this.userMedications.values())
      .find(userMed => userMed.userId === userId && userMed.medicationId === medicationId);
  }

  async getUserMedicationsByPrescription(prescriptionId: number): Promise<UserMedication[]> {
    return Array.from(this.userMedications.values())
      .filter(userMed => userMed.prescriptionId === prescriptionId);
  }

  async createUserMedication(medication: InsertUserMedication): Promise<UserMedication> {
    const id = this.userMedicationIdCounter++;
    const now = new Date();
    
    const newUserMedication: UserMedication = {
      ...medication,
      id,
      startDate: now,
      endDate: medication.endDate ?? null,
      dosage: medication.dosage ?? null,
      frequency: medication.frequency ?? null,
      instructions: medication.instructions ?? null,
      notes: medication.notes ?? null,
      active: medication.active ?? true,
      source: medication.source ?? 'manual',
    };
    
    this.userMedications.set(id, newUserMedication);
    return newUserMedication;
  }

  async updateUserMedication(id: number, medicationData: Partial<InsertUserMedication>): Promise<UserMedication | undefined> {
    const userMedication = await this.getUserMedication(id);
    if (!userMedication) return undefined;
    
    const updatedUserMedication: UserMedication = { ...userMedication, ...medicationData };
    this.userMedications.set(id, updatedUserMedication);
    return updatedUserMedication;
  }

  async toggleUserMedicationActive(id: number, active: boolean): Promise<UserMedication | undefined> {
    const userMedication = await this.getUserMedication(id);
    if (!userMedication) return undefined;
    
    const updatedUserMedication: UserMedication = { ...userMedication, active };
    this.userMedications.set(id, updatedUserMedication);
    return updatedUserMedication;
  }

  async deleteUserMedication(id: number): Promise<boolean> {
    const exists = this.userMedications.has(id);
    if (exists) {
      this.userMedications.delete(id);
      return true;
    }
    return false;
  }

  // User Medications Automatic Methods
  async addUserMedicationFromOrder(userId: number, medicationId: number, source: string): Promise<UserMedication | undefined> {
    // First check if user already has this medication
    const existingMed = await this.getUserMedicationsByUserAndMedication(userId, medicationId);
    
    if (existingMed) {
      // If medication already exists but is not active, reactivate it
      if (!existingMed.active) {
        return this.toggleUserMedicationActive(existingMed.id, true);
      }
      return existingMed; // Already exists and active
    }
    
    // Get medication details
    const medication = await this.getMedication(medicationId);
    if (!medication) return undefined;
    
    // Create new user medication
    const newUserMed = await this.createUserMedication({
      userId,
      medicationId,
      source,
      active: true,
      // Optional details from the medication if available
      dosage: medication.dosage ?? null,
    });
    
    return newUserMed;
  }

  async addUserMedicationFromPrescription(userId: number, medicationId: number, prescriptionId: number): Promise<UserMedication | undefined> {
    // First check if user already has this medication
    const existingMed = await this.getUserMedicationsByUserAndMedication(userId, medicationId);
    
    if (existingMed) {
      // If medication already exists but is not active, reactivate it
      if (!existingMed.active) {
        return this.toggleUserMedicationActive(existingMed.id, true);
      }
      // Update with prescription id if needed
      if (!existingMed.prescriptionId) {
        return this.updateUserMedication(existingMed.id, { prescriptionId });
      }
      return existingMed; // Already exists and active with prescription
    }
    
    // Get medication and prescription details
    const medication = await this.getMedication(medicationId);
    const prescription = await this.getPrescription(prescriptionId);
    if (!medication || !prescription) return undefined;
    
    // Create new user medication with prescription
    const newUserMed = await this.createUserMedication({
      userId,
      medicationId,
      prescriptionId,
      source: 'prescription',
      active: true,
      // Optional details from the medication if available
      dosage: medication.dosage ?? null,
      // Optional details from prescription if available
      instructions: prescription.notes ?? null,
    });
    
    return newUserMed;
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;
  
  constructor() {
    // Initialize PostgreSQL session store
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool: pool,
      tableName: 'session', // Default table name for session storage
      createTableIfMissing: true
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // Note: This implementation is unused because we're using MemStorage
  // Keeping the method signature for future database implementation
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.id);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  async updateUserRole(id: number, role: string): Promise<boolean> {
    // Validate role
    if (!['user', 'call_center', 'pharmacist', 'admin'].includes(role)) {
      return false;
    }
    
    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    
    return !!updatedUser;
  }
  
  // Password reset methods
  async storePasswordResetToken(userId: number, token: string, expiry: Date): Promise<boolean> {
    const [updatedUser] = await db
      .update(users)
      .set({
        resetToken: token,
        resetTokenExpiry: expiry,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return !!updatedUser;
  }
  
  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        sql`${users.resetToken} = ${token} AND ${users.resetTokenExpiry} > NOW()`
      );
    return user;
  }
  
  async resetPassword(userId: number, newPassword: string): Promise<boolean> {
    const [updatedUser] = await db
      .update(users)
      .set({
        password: newPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return !!updatedUser;
  }
  


  // Medication methods
  async getMedication(id: number): Promise<Medication | undefined> {
    const [medication] = await db.select().from(medications).where(eq(medications.id, id));
    return medication;
  }

  async getMedications(limit = 100, offset = 0): Promise<Medication[]> {
    return await db.select().from(medications).limit(limit).offset(offset);
  }

  async getMedicationsByCategory(category: string): Promise<Medication[]> {
    return await db.select().from(medications).where(eq(medications.category, category));
  }

  async searchMedications(query: string): Promise<Medication[]> {
    const searchPattern = `%${query}%`;
    return await db
      .select()
      .from(medications)
      .where(
        sql`${medications.name} ILIKE ${searchPattern} OR 
            ${medications.genericName} ILIKE ${searchPattern} OR 
            ${medications.brandName} ILIKE ${searchPattern}`
      );
  }

  async getPopularMedications(limit: number): Promise<Medication[]> {
    return await db
      .select()
      .from(medications)
      .orderBy(desc(medications.popularity))
      .limit(limit);
  }

  async createMedication(medication: InsertMedication): Promise<Medication> {
    const [newMedication] = await db.insert(medications).values(medication).returning();
    return newMedication;
  }

  async updateMedication(id: number, medicationData: Partial<InsertMedication>): Promise<Medication | undefined> {
    const [updatedMedication] = await db
      .update(medications)
      .set(medicationData)
      .where(eq(medications.id, id))
      .returning();
    return updatedMedication;
  }
  
  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  
  async getCategoryByName(name: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.name, name));
    return category;
  }
  
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
  
  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  // Prescription methods
  async getPrescription(id: number): Promise<Prescription | undefined> {
    const [prescription] = await db.select().from(prescriptions).where(eq(prescriptions.id, id));
    return prescription;
  }

  async getPrescriptionsByUser(userId: number): Promise<Prescription[]> {
    return await db.select().from(prescriptions).where(eq(prescriptions.userId, userId));
  }
  
  async getPrescriptionsForVerification(status?: string, limit = 20, offset = 0): Promise<Prescription[]> {
    // Execute the full query at once to avoid type issues
    if (status) {
      return await db
        .select()
        .from(prescriptions)
        .where(eq(prescriptions.status, status))
        .orderBy(desc(prescriptions.uploadDate))
        .limit(limit)
        .offset(offset);
    } else {
      return await db
        .select()
        .from(prescriptions)
        .where(eq(prescriptions.status, "pending"))
        .orderBy(desc(prescriptions.uploadDate))
        .limit(limit)
        .offset(offset);
    }
  }

  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    // Generate security code
    const securityCode = this.generateRandomSecurityCode();
    
    const [newPrescription] = await db.insert(prescriptions).values({
      ...prescription,
      status: prescription.status || "pending",
      securityCode: securityCode,
      revoked: false
    }).returning();
    
    return newPrescription;
  }

  async updatePrescription(id: number, prescriptionData: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const [updatedPrescription] = await db
      .update(prescriptions)
      .set(prescriptionData)
      .where(eq(prescriptions.id, id))
      .returning();
    return updatedPrescription;
  }
  
  // Helper method to generate a random security code
  private generateRandomSecurityCode(): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing characters like 0, O, 1, I
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }
  
  // Prescription verification methods
  async verifyPrescription(id: number, verifierId: number, verificationData: {
    status: string,
    verificationMethod: string,
    verificationNotes?: string,
    expirationDate?: Date
  }): Promise<Prescription | undefined> {
    const now = new Date();
    // Calculate default expiration date (1 year from verification)
    const defaultExpirationDate = new Date();
    defaultExpirationDate.setFullYear(defaultExpirationDate.getFullYear() + 1);
    
    const [updatedPrescription] = await db
      .update(prescriptions)
      .set({
        status: verificationData.status,
        verifiedBy: verifierId,
        verificationDate: now,
        verificationMethod: verificationData.verificationMethod,
        verificationNotes: verificationData.verificationNotes ?? null,
        expirationDate: verificationData.expirationDate ?? defaultExpirationDate
      })
      .where(eq(prescriptions.id, id))
      .returning();
      
    return updatedPrescription;
  }
  
  async revokePrescription(id: number, reason: string): Promise<Prescription | undefined> {
    const [updatedPrescription] = await db
      .update(prescriptions)
      .set({
        revoked: true,
        revokedReason: reason,
        status: 'rejected'
      })
      .where(eq(prescriptions.id, id))
      .returning();
      
    return updatedPrescription;
  }
  
  async generateSecurityCode(prescriptionId: number): Promise<string> {
    const securityCode = this.generateRandomSecurityCode();
    
    const [updatedPrescription] = await db
      .update(prescriptions)
      .set({ securityCode })
      .where(eq(prescriptions.id, prescriptionId))
      .returning();
      
    if (!updatedPrescription) {
      throw new Error("Prescription not found");
    }
    
    return securityCode;
  }
  
  async validatePrescriptionForMedication(prescriptionId: number, medicationId: number): Promise<{
    valid: boolean,
    reason?: string
  }> {
    const [prescription] = await db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.id, prescriptionId));
      
    if (!prescription) {
      return { valid: false, reason: "Prescription not found" };
    }
    
    // Check if prescription is approved
    if (prescription.status !== "approved") {
      return { valid: false, reason: "Prescription has not been approved" };
    }
    
    // Check if prescription is revoked
    if (prescription.revoked) {
      return { valid: false, reason: "Prescription has been revoked: " + prescription.revokedReason };
    }
    
    // Check if prescription is expired
    if (prescription.expirationDate && new Date() > new Date(prescription.expirationDate)) {
      return { valid: false, reason: "Prescription has expired" };
    }
    
    // For this demo, we'll consider all medications valid for any approved prescription
    return { valid: true };
  }

  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.orderDate));
  }
  
  async getOrdersByPrescription(prescriptionId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.prescriptionId, prescriptionId))
      .orderBy(desc(orders.orderDate));
  }
  
  async getOrdersByStatus(status: string, limit: number = 20, offset: number = 0): Promise<{ orders: Order[], total: number }> {
    // Get total count
    const [{ count }] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(orders)
      .where(eq(orders.status, status));
    
    // Get paginated results
    const results = await db
      .select()
      .from(orders)
      .where(eq(orders.status, status))
      .orderBy(desc(orders.orderDate))
      .limit(limit)
      .offset(offset);
      
    return {
      orders: results,
      total: count
    };
  }
  
  async getAllOrders(limit: number = 20, offset: number = 0, searchTerm: string = ''): Promise<{ orders: Order[], total: number }> {
    let query = db.select().from(orders);
    let countQuery = db.select({ count: sql`count(*)`.mapWith(Number) }).from(orders);
    
    // If search term is provided, search across multiple fields
    if (searchTerm) {
      const lowerSearchTerm = `%${searchTerm.toLowerCase()}%`;
      
      // Join with users table to search by user properties
      query = query
        .leftJoin(users, eq(orders.userId, users.id))
        .where(
          or(
            sql`LOWER(${orders.status}) LIKE ${lowerSearchTerm}`,
            sql`LOWER(${orders.trackingNumber}) LIKE ${lowerSearchTerm}`,
            sql`CAST(${orders.id} AS TEXT) LIKE ${lowerSearchTerm}`,
            sql`LOWER(${users.email}) LIKE ${lowerSearchTerm}`,
            sql`LOWER(${users.firstName}) LIKE ${lowerSearchTerm}`,
            sql`LOWER(${users.lastName}) LIKE ${lowerSearchTerm}`,
            sql`LOWER(${users.phone}) LIKE ${lowerSearchTerm}`
          )
        );
      
      // Apply the same conditions to the count query
      countQuery = countQuery
        .leftJoin(users, eq(orders.userId, users.id))
        .where(
          or(
            sql`LOWER(${orders.status}) LIKE ${lowerSearchTerm}`,
            sql`LOWER(${orders.trackingNumber}) LIKE ${lowerSearchTerm}`,
            sql`CAST(${orders.id} AS TEXT) LIKE ${lowerSearchTerm}`,
            sql`LOWER(${users.email}) LIKE ${lowerSearchTerm}`,
            sql`LOWER(${users.firstName}) LIKE ${lowerSearchTerm}`,
            sql`LOWER(${users.lastName}) LIKE ${lowerSearchTerm}`,
            sql`LOWER(${users.phone}) LIKE ${lowerSearchTerm}`
          )
        );
    }
    
    // Get total count
    const [{ count }] = await countQuery;
    
    // Add pagination and ordering to the main query
    const results = await query
      .orderBy(desc(orders.orderDate))
      .limit(limit)
      .offset(offset);
    
    return {
      orders: results,
      total: count
    };
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: number, orderData: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set(orderData)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Order item methods
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db.insert(orderItems).values(orderItem).returning();
    return newOrderItem;
  }

  // Insurance Provider methods
  async getInsuranceProvider(id: number): Promise<InsuranceProvider | undefined> {
    const [provider] = await db.select().from(insuranceProviders).where(eq(insuranceProviders.id, id));
    return provider;
  }
  
  async getInsuranceProviderByName(name: string): Promise<InsuranceProvider | undefined> {
    const [provider] = await db.select().from(insuranceProviders).where(eq(insuranceProviders.name, name));
    return provider;
  }
  
  async getInsuranceProviders(activeOnly = false): Promise<InsuranceProvider[]> {
    if (activeOnly) {
      return await db.select().from(insuranceProviders).where(eq(insuranceProviders.isActive, true));
    }
    return await db.select().from(insuranceProviders);
  }
  
  async createInsuranceProvider(provider: InsertInsuranceProvider): Promise<InsuranceProvider> {
    const [newProvider] = await db.insert(insuranceProviders).values(provider).returning();
    return newProvider;
  }
  
  async updateInsuranceProvider(id: number, provider: Partial<InsertInsuranceProvider>): Promise<InsuranceProvider | undefined> {
    const [updatedProvider] = await db
      .update(insuranceProviders)
      .set({
        ...provider,
        updatedAt: new Date()
      })
      .where(eq(insuranceProviders.id, id))
      .returning();
    return updatedProvider;
  }
  
  async deleteInsuranceProvider(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(insuranceProviders)
        .where(eq(insuranceProviders.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting insurance provider:', error);
      return false;
    }
  }
  
  // Patient Insurance methods
  async getInsurance(id: number): Promise<Insurance | undefined> {
    const [insuranceData] = await db.select().from(insurance).where(eq(insurance.id, id));
    return insuranceData;
  }

  async getInsurancesByUser(userId: number): Promise<Insurance[]> {
    return await db.select().from(insurance).where(eq(insurance.userId, userId));
  }

  async createInsurance(insuranceData: InsertInsurance): Promise<Insurance> {
    const [newInsurance] = await db.insert(insurance).values(insuranceData).returning();
    return newInsurance;
  }

  async updateInsurance(id: number, insuranceData: Partial<InsertInsurance>): Promise<Insurance | undefined> {
    const [updatedInsurance] = await db
      .update(insurance)
      .set(insuranceData)
      .where(eq(insurance.id, id))
      .returning();
    return updatedInsurance;
  }

  // Cart methods
  async getCart(userId: number): Promise<Cart | undefined> {
    const [userCart] = await db.select().from(cart).where(eq(cart.userId, userId));
    return userCart;
  }

  async createCart(cartData: InsertCart): Promise<Cart> {
    // Ensure items is treated as an array of CartItem objects
    const items: CartItem[] = Array.isArray(cartData.items) 
      ? cartData.items.map((item: any) => ({
          medicationId: Number(item.medicationId),
          quantity: Number(item.quantity),
          name: String(item.name || ''),
          price: Number(item.price),
          requiresPrescription: Boolean(item.requiresPrescription)
        }))
      : [];
    
    const data = {
      ...cartData,
      items
    };
    
    const [newCart] = await db.insert(cart).values(data).returning();
    return newCart;
  }

  async updateCart(userId: number, items: CartItem[]): Promise<Cart | undefined> {
    // Ensure items is a proper array of CartItem objects
    const itemsArray: CartItem[] = Array.isArray(items) 
      ? items.map((item: any) => ({
          medicationId: Number(item.medicationId),
          quantity: Number(item.quantity),
          name: String(item.name || ''),
          price: Number(item.price),
          requiresPrescription: Boolean(item.requiresPrescription)
        }))
      : [];
    
    // Get existing cart or create a new one
    let existingCart = await this.getCart(userId);
    
    if (!existingCart) {
      // Create a new cart if none exists
      return await this.createCart({ userId, items: itemsArray });
    }
    
    // Update existing cart
    const [updatedCart] = await db
      .update(cart)
      .set({ 
        items: itemsArray,
        updatedAt: new Date()
      })
      .where(eq(cart.userId, userId))
      .returning();
      
    return updatedCart;
  }
  
  async clearCart(userId: number): Promise<boolean> {
    // Get existing cart
    const existingCart = await this.getCart(userId);
    
    if (!existingCart) {
      return true; // Cart doesn't exist, so it's already "cleared"
    }
    
    // Update the cart with an empty items array
    try {
      await db
        .update(cart)
        .set({ 
          items: [],
          updatedAt: new Date()
        })
        .where(eq(cart.userId, userId));
      
      return true;
    } catch (error) {
      console.error('Error clearing cart:', error);
      return false;
    }
  }

  // Refill Request methods
  async getRefillRequest(id: number): Promise<RefillRequest | undefined> {
    const [request] = await db.select().from(refillRequests).where(eq(refillRequests.id, id));
    return request;
  }

  async getRefillRequestsByUser(userId: number): Promise<RefillRequest[]> {
    return await db
      .select()
      .from(refillRequests)
      .where(eq(refillRequests.userId, userId))
      .orderBy(desc(refillRequests.requestDate));
  }

  async getRefillRequestsByPrescription(prescriptionId: number): Promise<RefillRequest[]> {
    return await db
      .select()
      .from(refillRequests)
      .where(eq(refillRequests.prescriptionId, prescriptionId))
      .orderBy(desc(refillRequests.requestDate));
  }

  async createRefillRequest(request: InsertRefillRequest): Promise<RefillRequest> {
    const [newRequest] = await db.insert(refillRequests).values(request).returning();
    return newRequest;
  }

  async updateRefillRequest(id: number, requestData: Partial<InsertRefillRequest>): Promise<RefillRequest | undefined> {
    const [updatedRequest] = await db
      .update(refillRequests)
      .set(requestData)
      .where(eq(refillRequests.id, id))
      .returning();
    return updatedRequest;
  }

  // Refill Notification methods
  async getRefillNotification(id: number): Promise<RefillNotification | undefined> {
    const [notification] = await db.select().from(refillNotifications).where(eq(refillNotifications.id, id));
    return notification;
  }

  async getRefillNotificationsByUser(userId: number): Promise<RefillNotification[]> {
    return await db
      .select()
      .from(refillNotifications)
      .where(eq(refillNotifications.userId, userId))
      .orderBy(desc(refillNotifications.sentDate));
  }

  async getRefillNotificationsByRefillRequest(refillRequestId: number): Promise<RefillNotification[]> {
    return await db
      .select()
      .from(refillNotifications)
      .where(eq(refillNotifications.refillRequestId, refillRequestId))
      .orderBy(desc(refillNotifications.sentDate));
  }

  async createRefillNotification(notification: InsertRefillNotification): Promise<RefillNotification> {
    const [newNotification] = await db.insert(refillNotifications).values(notification).returning();
    return newNotification;
  }

  async markRefillNotificationAsRead(id: number): Promise<RefillNotification | undefined> {
    const [updatedNotification] = await db
      .update(refillNotifications)
      .set({ read: true })
      .where(eq(refillNotifications.id, id))
      .returning();
    return updatedNotification;
  }
  
  // White Label Configuration methods
  async getWhiteLabel(id: number): Promise<WhiteLabel | undefined> {
    const [config] = await db.select().from(whiteLabels).where(eq(whiteLabels.id, id));
    return config;
  }
  
  async getWhiteLabelByName(name: string): Promise<WhiteLabel | undefined> {
    const [config] = await db.select().from(whiteLabels).where(eq(whiteLabels.name, name));
    return config;
  }
  
  async getActiveWhiteLabel(): Promise<WhiteLabel | undefined> {
    const [config] = await db.select().from(whiteLabels).where(eq(whiteLabels.isActive, true));
    return config;
  }
  
  async getDefaultWhiteLabel(): Promise<WhiteLabel | undefined> {
    const [config] = await db.select().from(whiteLabels).where(eq(whiteLabels.isDefault, true));
    return config;
  }
  
  async getWhiteLabels(): Promise<WhiteLabel[]> {
    return await db.select().from(whiteLabels).orderBy(whiteLabels.name);
  }
  
  async createWhiteLabel(config: InsertWhiteLabel): Promise<WhiteLabel> {
    const [newConfig] = await db.insert(whiteLabels).values(config).returning();
    return newConfig;
  }
  
  async updateWhiteLabel(id: number, config: Partial<InsertWhiteLabel>): Promise<WhiteLabel | undefined> {
    const [updatedConfig] = await db
      .update(whiteLabels)
      .set({
        ...config,
        updatedAt: new Date()
      })
      .where(eq(whiteLabels.id, id))
      .returning();
    return updatedConfig;
  }
  
  async activateWhiteLabel(id: number): Promise<WhiteLabel | undefined> {
    // First deactivate any active white label
    await db
      .update(whiteLabels)
      .set({ isActive: false })
      .where(eq(whiteLabels.isActive, true));
    
    // Now activate the requested white label
    const [activatedConfig] = await db
      .update(whiteLabels)
      .set({ 
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(whiteLabels.id, id))
      .returning();
    
    return activatedConfig;
  }
  
  async deactivateWhiteLabel(id: number): Promise<WhiteLabel | undefined> {
    const [deactivatedConfig] = await db
      .update(whiteLabels)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(whiteLabels.id, id))
      .returning();
    
    return deactivatedConfig;
  }
  
  async setDefaultWhiteLabel(id: number): Promise<WhiteLabel | undefined> {
    // First clear any existing default white label
    await db
      .update(whiteLabels)
      .set({ isDefault: false })
      .where(eq(whiteLabels.isDefault, true));
    
    // Now set the requested white label as default
    const [defaultConfig] = await db
      .update(whiteLabels)
      .set({ 
        isDefault: true,
        updatedAt: new Date()
      })
      .where(eq(whiteLabels.id, id))
      .returning();
    
    return defaultConfig;
  }
  
  async unsetDefaultWhiteLabel(id: number): Promise<WhiteLabel | undefined> {
    const [unsetConfig] = await db
      .update(whiteLabels)
      .set({ 
        isDefault: false,
        updatedAt: new Date()
      })
      .where(eq(whiteLabels.id, id))
      .returning();
    
    return unsetConfig;
  }

  // Inventory Provider methods
  async getInventoryProvider(id: number): Promise<InventoryProvider | undefined> {
    const [provider] = await db.select().from(inventoryProviders).where(eq(inventoryProviders.id, id));
    return provider;
  }

  async getInventoryProviderByName(name: string): Promise<InventoryProvider | undefined> {
    const [provider] = await db.select().from(inventoryProviders).where(eq(inventoryProviders.name, name));
    return provider;
  }

  async getInventoryProviders(activeOnly = false): Promise<InventoryProvider[]> {
    if (activeOnly) {
      return await db.select().from(inventoryProviders).where(eq(inventoryProviders.isActive, true));
    }
    return await db.select().from(inventoryProviders);
  }

  async createInventoryProvider(provider: InsertInventoryProvider): Promise<InventoryProvider> {
    const [newProvider] = await db.insert(inventoryProviders).values(provider).returning();
    return newProvider;
  }

  async updateInventoryProvider(id: number, providerData: Partial<InsertInventoryProvider>): Promise<InventoryProvider | undefined> {
    const [updatedProvider] = await db
      .update(inventoryProviders)
      .set(providerData)
      .where(eq(inventoryProviders.id, id))
      .returning();
    return updatedProvider;
  }

  async updateInventoryProviderStatus(id: number, status: { connectionStatus: string, lastSyncDate?: Date }): Promise<InventoryProvider | undefined> {
    const [updatedProvider] = await db
      .update(inventoryProviders)
      .set({
        connectionStatus: status.connectionStatus,
        lastSyncDate: status.lastSyncDate,
        updatedAt: new Date()
      })
      .where(eq(inventoryProviders.id, id))
      .returning();
    return updatedProvider;
  }

  async deleteInventoryProvider(id: number): Promise<boolean> {
    // First, delete all associated inventory items and their mappings
    const items = await this.getInventoryItemsByProvider(id);
    for (const item of items) {
      await this.deleteInventoryItem(item.id);
    }
    
    const [deletedProvider] = await db
      .delete(inventoryProviders)
      .where(eq(inventoryProviders.id, id))
      .returning();
    return !!deletedProvider;
  }

  // Inventory Item methods
  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item;
  }

  async getInventoryItemByExternalId(providerId: number, externalId: string): Promise<InventoryItem | undefined> {
    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(
        sql`${inventoryItems.providerId} = ${providerId} AND ${inventoryItems.externalId} = ${externalId}`
      );
    return item;
  }

  async getInventoryItemsByProvider(providerId: number): Promise<InventoryItem[]> {
    return await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.providerId, providerId));
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [newItem] = await db.insert(inventoryItems).values(item).returning();
    return newItem;
  }

  async updateInventoryItem(id: number, itemData: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const [updatedItem] = await db
      .update(inventoryItems)
      .set(itemData)
      .where(eq(inventoryItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    // First, delete all associated mappings
    await db
      .delete(inventoryMappings)
      .where(eq(inventoryMappings.inventoryItemId, id));
    
    const [deletedItem] = await db
      .delete(inventoryItems)
      .where(eq(inventoryItems.id, id))
      .returning();
    return !!deletedItem;
  }

  // Inventory Mapping methods
  async getInventoryMapping(id: number): Promise<InventoryMapping | undefined> {
    const [mapping] = await db.select().from(inventoryMappings).where(eq(inventoryMappings.id, id));
    return mapping;
  }

  async getInventoryMappingByItemAndMedication(inventoryItemId: number, medicationId: number): Promise<InventoryMapping | undefined> {
    const [mapping] = await db
      .select()
      .from(inventoryMappings)
      .where(
        sql`${inventoryMappings.inventoryItemId} = ${inventoryItemId} AND ${inventoryMappings.medicationId} = ${medicationId}`
      );
    return mapping;
  }

  async getInventoryMappingsByMedication(medicationId: number): Promise<InventoryMapping[]> {
    return await db
      .select()
      .from(inventoryMappings)
      .where(eq(inventoryMappings.medicationId, medicationId));
  }

  async getInventoryMappingsByItem(inventoryItemId: number): Promise<InventoryMapping[]> {
    return await db
      .select()
      .from(inventoryMappings)
      .where(eq(inventoryMappings.inventoryItemId, inventoryItemId));
  }

  async createInventoryMapping(mapping: InsertInventoryMapping): Promise<InventoryMapping> {
    // If this is set as primary, set all other mappings for this medication to non-primary
    if (mapping.isPrimary) {
      await db
        .update(inventoryMappings)
        .set({ isPrimary: false })
        .where(
          sql`${inventoryMappings.medicationId} = ${mapping.medicationId} AND ${inventoryMappings.isPrimary} = true`
        );
    }
    
    const [newMapping] = await db.insert(inventoryMappings).values(mapping).returning();
    return newMapping;
  }

  async updateInventoryMapping(id: number, mappingData: Partial<InsertInventoryMapping>): Promise<InventoryMapping | undefined> {
    // If updating to primary, set all other mappings for this medication to non-primary
    if (mappingData.isPrimary) {
      const [mapping] = await db.select().from(inventoryMappings).where(eq(inventoryMappings.id, id));
      if (mapping && !mapping.isPrimary) {
        await db
          .update(inventoryMappings)
          .set({ isPrimary: false })
          .where(
            sql`${inventoryMappings.medicationId} = ${mapping.medicationId} AND ${inventoryMappings.id} <> ${id} AND ${inventoryMappings.isPrimary} = true`
          );
      }
    }
    
    const [updatedMapping] = await db
      .update(inventoryMappings)
      .set({
        ...mappingData,
        updatedAt: new Date()
      })
      .where(eq(inventoryMappings.id, id))
      .returning();
    return updatedMapping;
  }

  async deleteInventoryMapping(id: number): Promise<boolean> {
    const [deletedMapping] = await db
      .delete(inventoryMappings)
      .where(eq(inventoryMappings.id, id))
      .returning();
    return !!deletedMapping;
  }

  // Helper method for inventory service
  getAllMedicationsSync(): Medication[] {
    // This is a synchronous method in MemStorage but needs to be async for DB
    // In a real implementation, this would be cached or optimized differently
    try {
      // Using a synchronous approach since the interface requires this method to be synchronous
      // For now, returning an empty array as a fallback since drizzle-orm doesn't support synchronous operations
      console.warn("Using synchronous operation in DatabaseStorage.getAllMedicationsSync(). This should be refactored to async.");
      return [];
    } catch (error) {
      console.error("Error fetching medications synchronously:", error);
      return [];
    }
  }

  // User Medications methods
  async getUserMedication(id: number): Promise<UserMedication | undefined> {
    const [userMedication] = await db.select().from(userMedications).where(eq(userMedications.id, id));
    return userMedication;
  }

  async getUserMedicationsByUser(userId: number): Promise<UserMedication[]> {
    return await db
      .select()
      .from(userMedications)
      .where(eq(userMedications.userId, userId))
      .orderBy(userMedications.startDate);
  }

  async getUserMedicationsByUserAndMedication(userId: number, medicationId: number): Promise<UserMedication | undefined> {
    const [userMedication] = await db
      .select()
      .from(userMedications)
      .where(and(
        eq(userMedications.userId, userId),
        eq(userMedications.medicationId, medicationId)
      ));
    return userMedication;
  }

  async getUserMedicationsByPrescription(prescriptionId: number): Promise<UserMedication[]> {
    return await db
      .select()
      .from(userMedications)
      .where(eq(userMedications.prescriptionId, prescriptionId));
  }

  async createUserMedication(medication: InsertUserMedication): Promise<UserMedication> {
    const [newUserMedication] = await db
      .insert(userMedications)
      .values(medication)
      .returning();
    return newUserMedication;
  }

  async updateUserMedication(id: number, medicationData: Partial<InsertUserMedication>): Promise<UserMedication | undefined> {
    const [updatedUserMedication] = await db
      .update(userMedications)
      .set(medicationData)
      .where(eq(userMedications.id, id))
      .returning();
    return updatedUserMedication;
  }

  async toggleUserMedicationActive(id: number, active: boolean): Promise<UserMedication | undefined> {
    const [updatedUserMedication] = await db
      .update(userMedications)
      .set({ active })
      .where(eq(userMedications.id, id))
      .returning();
    return updatedUserMedication;
  }

  async deleteUserMedication(id: number): Promise<boolean> {
    const result = await db
      .delete(userMedications)
      .where(eq(userMedications.id, id));
    return !!result.rowCount;
  }

  // User Medications Automatic Methods
  async addUserMedicationFromOrder(userId: number, medicationId: number, source: string): Promise<UserMedication | undefined> {
    // First check if user already has this medication
    const existingMed = await this.getUserMedicationsByUserAndMedication(userId, medicationId);
    
    if (existingMed) {
      // If medication already exists but is not active, reactivate it
      if (!existingMed.active) {
        return this.toggleUserMedicationActive(existingMed.id, true);
      }
      return existingMed; // Already exists and active
    }
    
    // Get medication details
    const medication = await this.getMedication(medicationId);
    if (!medication) return undefined;
    
    // Create new user medication
    const newUserMed = await this.createUserMedication({
      userId,
      medicationId,
      source,
      active: true,
      // Optional details from the medication if available
      dosage: medication.dosage ?? null,
    });
    
    return newUserMed;
  }

  async addUserMedicationFromPrescription(userId: number, medicationId: number, prescriptionId: number): Promise<UserMedication | undefined> {
    // First check if user already has this medication
    const existingMed = await this.getUserMedicationsByUserAndMedication(userId, medicationId);
    
    if (existingMed) {
      // If medication already exists but is not active, reactivate it
      if (!existingMed.active) {
        return this.toggleUserMedicationActive(existingMed.id, true);
      }
      // Update with prescription id if needed
      if (!existingMed.prescriptionId) {
        return this.updateUserMedication(existingMed.id, { prescriptionId });
      }
      return existingMed; // Already exists and active with prescription
    }
    
    // Get medication and prescription details
    const medication = await this.getMedication(medicationId);
    const prescription = await this.getPrescription(prescriptionId);
    if (!medication || !prescription) return undefined;
    
    // Create new user medication with prescription
    const newUserMed = await this.createUserMedication({
      userId,
      medicationId,
      prescriptionId,
      source: 'prescription',
      active: true,
      // Optional details from the medication if available
      dosage: medication.dosage ?? null,
      // Optional details from prescription if available
      instructions: prescription.notes ?? null,
    });
    
    return newUserMed;
  }
}

// Use DatabaseStorage for persistent data storage in PostgreSQL
export const storage = new DatabaseStorage();
