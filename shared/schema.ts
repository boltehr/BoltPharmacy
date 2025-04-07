import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json, foreignKey, primaryKey, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  // Shipping address
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  // Billing address
  billingAddress: text("billing_address"),
  billingCity: text("billing_city"),
  billingState: text("billing_state"),
  billingZipCode: text("billing_zip_code"),
  // Flag for same billing as shipping address
  sameAsShipping: boolean("same_as_shipping").default(true),
  // User info
  dateOfBirth: text("date_of_birth"),
  sexAtBirth: text("sex_at_birth"),
  // Profile completion status
  profileCompleted: boolean("profile_completed").default(false),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Insurance schema
export const insurance = pgTable("insurance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(),
  memberId: text("member_id").notNull(),
  groupNumber: text("group_number"),
  phoneNumber: text("phone_number"),
  isPrimary: boolean("is_primary").default(false),
});

export const insertInsuranceSchema = createInsertSchema(insurance).omit({
  id: true,
});

// Medications schema
export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  genericName: text("generic_name"),
  brandName: text("brand_name"),
  description: text("description"),
  uses: text("uses"),
  sideEffects: text("side_effects"),
  dosage: text("dosage"),
  price: doublePrecision("price").notNull(),
  retailPrice: doublePrecision("retail_price"),
  requiresPrescription: boolean("requires_prescription").default(true),
  inStock: boolean("in_stock").default(true),
  category: text("category"),
  imageUrl: text("image_url"),
  popularity: integer("popularity").default(0),
});

export const insertMedicationSchema = createInsertSchema(medications).omit({
  id: true,
});

// Categories schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

// Prescriptions schema
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  doctorName: text("doctor_name"),
  doctorPhone: text("doctor_phone"),
  uploadDate: timestamp("upload_date").defaultNow(),
  status: text("status").default("pending"),
  fileUrl: text("file_url"),
  notes: text("notes"),
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  uploadDate: true,
});

// Orders schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  orderDate: timestamp("order_date").defaultNow(),
  status: text("status").default("pending"),
  shippingMethod: text("shipping_method").notNull(),
  shippingCost: doublePrecision("shipping_cost").notNull(),
  total: doublePrecision("total").notNull(),
  shippingAddress: text("shipping_address"),
  trackingNumber: text("tracking_number"),
  carrier: text("carrier"),
  prescriptionId: integer("prescription_id").references(() => prescriptions.id),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderDate: true,
});

// Order items schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  medicationId: integer("medication_id").notNull().references(() => medications.id),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

// Cart schema (for storing user cart data)
export const cart = pgTable("cart", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  items: json("items").notNull().$type<CartItem[]>(),
});

export const insertCartSchema = createInsertSchema(cart).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Define CartItem type for JSON column
export type CartItem = {
  medicationId: number;
  quantity: number;
  name: string;
  price: number;
  requiresPrescription: boolean;
};

// Refill requests schema
export const refillRequests = pgTable("refill_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  prescriptionId: integer("prescription_id").references(() => prescriptions.id),
  medicationId: integer("medication_id").notNull().references(() => medications.id),
  requestDate: timestamp("request_date").defaultNow(),
  status: text("status").default("pending").notNull(), // pending, approved, declined, filled
  quantity: integer("quantity").notNull().default(1),
  notes: text("notes"),
  lastFilledDate: timestamp("last_filled_date"), // Track when prescription was last filled
  nextRefillDate: date("next_refill_date"), // Expected date for next refill
  timesRefilled: integer("times_refilled").default(0), // Number of times this medication has been refilled
  refillsRemaining: integer("refills_remaining"), // Number of refills left
  refillsAuthorized: integer("refills_authorized"), // Total number of refills authorized
  autoRefill: boolean("auto_refill").default(false), // Whether to automatically process refills
});

export const insertRefillRequestSchema = createInsertSchema(refillRequests).omit({
  id: true,
  requestDate: true,
  status: true,
});

// Refill notifications schema
export const refillNotifications = pgTable("refill_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  refillRequestId: integer("refill_request_id").references(() => refillRequests.id),
  message: text("message").notNull(),
  sentDate: timestamp("sent_date").defaultNow(),
  read: boolean("read").default(false),
  notificationType: text("notification_type").notNull(), // reminder, status_update, etc.
});

export const insertRefillNotificationSchema = createInsertSchema(refillNotifications).omit({
  id: true,
  sentDate: true,
  read: true,
});

// Define relations between tables
export const usersRelations = relations(users, ({ many }) => ({
  prescriptions: many(prescriptions),
  orders: many(orders),
  insurance: many(insurance),
  cart: many(cart),
  refillRequests: many(refillRequests),
  refillNotifications: many(refillNotifications),
}));

export const insuranceRelations = relations(insurance, ({ one }) => ({
  user: one(users, {
    fields: [insurance.userId],
    references: [users.id],
  }),
}));

export const medicationsRelations = relations(medications, ({ many }) => ({
  orderItems: many(orderItems),
  refillRequests: many(refillRequests),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  // In a real implementation, there would be a many-to-many relation between categories and medications
}));

export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [prescriptions.userId],
    references: [users.id],
  }),
  orders: many(orders),
  refillRequests: many(refillRequests),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  prescription: one(prescriptions, {
    fields: [orders.prescriptionId],
    references: [prescriptions.id],
  }),
  orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  medication: one(medications, {
    fields: [orderItems.medicationId],
    references: [medications.id],
  }),
}));

export const cartRelations = relations(cart, ({ one }) => ({
  user: one(users, {
    fields: [cart.userId],
    references: [users.id],
  }),
}));

export const refillRequestsRelations = relations(refillRequests, ({ one, many }) => ({
  user: one(users, {
    fields: [refillRequests.userId],
    references: [users.id],
  }),
  prescription: one(prescriptions, {
    fields: [refillRequests.prescriptionId],
    references: [prescriptions.id],
  }),
  medication: one(medications, {
    fields: [refillRequests.medicationId],
    references: [medications.id],
  }),
  notifications: many(refillNotifications),
}));

export const refillNotificationsRelations = relations(refillNotifications, ({ one }) => ({
  user: one(users, {
    fields: [refillNotifications.userId],
    references: [users.id],
  }),
  refillRequest: one(refillRequests, {
    fields: [refillNotifications.refillRequestId],
    references: [refillRequests.id],
  }),
}));

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Insurance = typeof insurance.$inferSelect;
export type InsertInsurance = z.infer<typeof insertInsuranceSchema>;

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Cart = typeof cart.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;

export type RefillRequest = typeof refillRequests.$inferSelect;
export type InsertRefillRequest = z.infer<typeof insertRefillRequestSchema>;

export type RefillNotification = typeof refillNotifications.$inferSelect;
export type InsertRefillNotification = z.infer<typeof insertRefillNotificationSchema>;

// White Label Configuration schema
export const whiteLabels = pgTable("white_labels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  logo: text("logo"),
  primaryColor: text("primary_color").default("#3b82f6"), // Default blue
  secondaryColor: text("secondary_color").default("#10b981"), // Default green
  accentColor: text("accent_color").default("#f59e0b"), // Default amber
  fontFamily: text("font_family").default("Inter"),
  customCss: text("custom_css"),
  favicon: text("favicon"),
  companyName: text("company_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  address: text("address"),
  customFooter: text("custom_footer"),
  customHeader: text("custom_header"),
  termsUrl: text("terms_url"),
  privacyUrl: text("privacy_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(false),
});

export const insertWhiteLabelSchema = createInsertSchema(whiteLabels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type WhiteLabel = typeof whiteLabels.$inferSelect;
export type InsertWhiteLabel = z.infer<typeof insertWhiteLabelSchema>;