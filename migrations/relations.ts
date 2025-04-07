import { relations } from "drizzle-orm/relations";
import { users, insurance, cart, orders, prescriptions, orderItems, medications } from "./schema";

export const insuranceRelations = relations(insurance, ({one}) => ({
	user: one(users, {
		fields: [insurance.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	insurances: many(insurance),
	carts: many(cart),
	orders: many(orders),
	prescriptions: many(prescriptions),
}));

export const cartRelations = relations(cart, ({one}) => ({
	user: one(users, {
		fields: [cart.userId],
		references: [users.id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	prescription: one(prescriptions, {
		fields: [orders.prescriptionId],
		references: [prescriptions.id]
	}),
	orderItems: many(orderItems),
}));

export const prescriptionsRelations = relations(prescriptions, ({one, many}) => ({
	orders: many(orders),
	user: one(users, {
		fields: [prescriptions.userId],
		references: [users.id]
	}),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	medication: one(medications, {
		fields: [orderItems.medicationId],
		references: [medications.id]
	}),
}));

export const medicationsRelations = relations(medications, ({many}) => ({
	orderItems: many(orderItems),
}));