import { pgTable, foreignKey, serial, integer, text, boolean, unique, timestamp, json, doublePrecision } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const insurance = pgTable("insurance", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	provider: text().notNull(),
	memberId: text("member_id").notNull(),
	groupNumber: text("group_number"),
	phoneNumber: text("phone_number"),
	isPrimary: boolean("is_primary").default(false),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "insurance_user_id_users_id_fk"
		}),
]);

export const categories = pgTable("categories", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	icon: text(),
}, (table) => [
	unique("categories_name_unique").on(table.name),
]);

export const cart = pgTable("cart", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	items: json().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "cart_user_id_users_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	firstName: text("first_name"),
	lastName: text("last_name"),
	email: text().notNull(),
	phone: text(),
	address: text(),
	city: text(),
	state: text(),
	zipCode: text("zip_code"),
	dateOfBirth: text("date_of_birth"),
	sexAtBirth: text("sex_at_birth"),
}, (table) => [
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
]);

export const orders = pgTable("orders", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	orderDate: timestamp("order_date", { mode: 'string' }).defaultNow(),
	status: text().default('pending'),
	shippingMethod: text("shipping_method").notNull(),
	shippingCost: doublePrecision("shipping_cost").notNull(),
	total: doublePrecision().notNull(),
	shippingAddress: text("shipping_address"),
	trackingNumber: text("tracking_number"),
	carrier: text(),
	prescriptionId: integer("prescription_id"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.prescriptionId],
			foreignColumns: [prescriptions.id],
			name: "orders_prescription_id_prescriptions_id_fk"
		}),
]);

export const orderItems = pgTable("order_items", {
	id: serial().primaryKey().notNull(),
	orderId: integer("order_id").notNull(),
	medicationId: integer("medication_id").notNull(),
	quantity: integer().notNull(),
	price: doublePrecision().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.medicationId],
			foreignColumns: [medications.id],
			name: "order_items_medication_id_medications_id_fk"
		}),
]);

export const medications = pgTable("medications", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	genericName: text("generic_name"),
	brandName: text("brand_name"),
	description: text(),
	uses: text(),
	sideEffects: text("side_effects"),
	dosage: text(),
	price: doublePrecision().notNull(),
	retailPrice: doublePrecision("retail_price"),
	requiresPrescription: boolean("requires_prescription").default(true),
	inStock: boolean("in_stock").default(true),
	category: text(),
	imageUrl: text("image_url"),
	popularity: integer().default(0),
});

export const prescriptions = pgTable("prescriptions", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	doctorName: text("doctor_name"),
	doctorPhone: text("doctor_phone"),
	uploadDate: timestamp("upload_date", { mode: 'string' }).defaultNow(),
	status: text().default('pending'),
	fileUrl: text("file_url"),
	notes: text(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "prescriptions_user_id_users_id_fk"
		}),
]);
