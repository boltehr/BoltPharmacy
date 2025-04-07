import {
  users, type User, type InsertUser,
  medications, type Medication, type InsertMedication,
  categories, type Category, type InsertCategory,
  prescriptions, type Prescription, type InsertPrescription,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem,
  insurance, type Insurance, type InsertInsurance,
  cart, type Cart, type InsertCart, type CartItem
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
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
  
  // Prescription methods
  getPrescription(id: number): Promise<Prescription | undefined>;
  getPrescriptionsByUser(userId: number): Promise<Prescription[]>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: number, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined>;
  
  // Order methods
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  
  // Order item methods
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  
  // Insurance methods
  getInsurance(id: number): Promise<Insurance | undefined>;
  getInsurancesByUser(userId: number): Promise<Insurance[]>;
  createInsurance(insurance: InsertInsurance): Promise<Insurance>;
  updateInsurance(id: number, insurance: Partial<InsertInsurance>): Promise<Insurance | undefined>;
  
  // Cart methods
  getCart(userId: number): Promise<Cart | undefined>;
  createCart(cart: InsertCart): Promise<Cart>;
  updateCart(userId: number, items: CartItem[]): Promise<Cart | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private medications: Map<number, Medication>;
  private categories: Map<number, Category>;
  private prescriptions: Map<number, Prescription>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem[]>;
  private insurances: Map<number, Insurance>;
  private carts: Map<number, Cart>;
  
  private userIdCounter: number;
  private medicationIdCounter: number;
  private categoryIdCounter: number;
  private prescriptionIdCounter: number;
  private orderIdCounter: number;
  private orderItemIdCounter: number;
  private insuranceIdCounter: number;
  private cartIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.medications = new Map();
    this.categories = new Map();
    this.prescriptions = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.insurances = new Map();
    this.carts = new Map();
    
    this.userIdCounter = 1;
    this.medicationIdCounter = 1;
    this.categoryIdCounter = 1;
    this.prescriptionIdCounter = 1;
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;
    this.insuranceIdCounter = 1;
    this.cartIdCounter = 1;
    
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
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
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
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }
  
  async createMedication(medication: InsertMedication): Promise<Medication> {
    const id = this.medicationIdCounter++;
    const newMedication: Medication = { ...medication, id };
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
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  // Prescription methods
  async getPrescription(id: number): Promise<Prescription | undefined> {
    return this.prescriptions.get(id);
  }
  
  async getPrescriptionsByUser(userId: number): Promise<Prescription[]> {
    return Array.from(this.prescriptions.values()).filter(prescription => prescription.userId === userId);
  }
  
  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const id = this.prescriptionIdCounter++;
    const now = new Date();
    const newPrescription: Prescription = { 
      ...prescription, 
      id, 
      uploadDate: now,
      status: prescription.status || 'pending' 
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
  
  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async getOrdersByUser(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const now = new Date();
    const newOrder: Order = { 
      ...order, 
      id, 
      orderDate: now,
      status: order.status || 'pending'
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
  
  // Insurance methods
  async getInsurance(id: number): Promise<Insurance | undefined> {
    return this.insurances.get(id);
  }
  
  async getInsurancesByUser(userId: number): Promise<Insurance[]> {
    return Array.from(this.insurances.values()).filter(insurance => insurance.userId === userId);
  }
  
  async createInsurance(insurance: InsertInsurance): Promise<Insurance> {
    const id = this.insuranceIdCounter++;
    const newInsurance: Insurance = { ...insurance, id };
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
  
  async createCart(cart: InsertCart): Promise<Cart> {
    const id = this.cartIdCounter++;
    const now = new Date();
    const newCart: Cart = { 
      ...cart, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.carts.set(id, newCart);
    return newCart;
  }
  
  async updateCart(userId: number, items: CartItem[]): Promise<Cart | undefined> {
    let cart = await this.getCart(userId);
    
    if (!cart) {
      // Create new cart if it doesn't exist
      cart = await this.createCart({ userId, items });
      return cart;
    }
    
    // Update existing cart
    const now = new Date();
    const updatedCart: Cart = { 
      ...cart, 
      items,
      updatedAt: now
    };
    
    this.carts.set(cart.id, updatedCart);
    return updatedCart;
  }
}

export const storage = new MemStorage();
