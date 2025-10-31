import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  title: text("title").notNull(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  theme: text("theme").notNull(),
  budget: integer("budget").notNull(),
  days: jsonb("days").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").references(() => trips.id),
  type: text("type").notNull(), // 'flight', 'hotel', 'activity'
  title: text("title").notNull(),
  details: text("details").notNull(),
  provider: text("provider"),
  price: integer("price").notNull(),
  included: boolean("included").default(true),
  dayNumber: integer("day_number"),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;

export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;

// Trip generation request schema
export const tripRequestSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  theme: z.string().min(1),
  budget: z.number().min(10000).max(500000),
});

export type TripRequest = z.infer<typeof tripRequestSchema>;

// Vibes request schema
export const vibesRequestSchema = z.object({
  destination: z.string().min(1),
});

export type VibesRequest = z.infer<typeof vibesRequestSchema>;

// Chat message schema
export const chatMessageSchema = z.object({
  message: z.string().min(1),
  tripId: z.string().optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
