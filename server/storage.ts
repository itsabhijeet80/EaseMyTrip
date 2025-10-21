import { type User, type InsertUser, type Trip, type InsertTrip, type CartItem, type InsertCartItem } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Trips
  getTrip(id: string): Promise<Trip | undefined>;
  getTripsByUser(userId: string): Promise<Trip[]>;
  createTrip(trip: InsertTrip & { userId: string }): Promise<Trip>;
  updateTrip(id: string, trip: Partial<Trip>): Promise<Trip | undefined>;
  
  // Cart Items
  getCartItems(tripId: string): Promise<CartItem[]>;
  createCartItem(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, item: Partial<CartItem>): Promise<CartItem | undefined>;
  deleteCartItem(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private trips: Map<string, Trip>;
  private cartItems: Map<string, CartItem>;

  constructor() {
    this.users = new Map();
    this.trips = new Map();
    this.cartItems = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Trips
  async getTrip(id: string): Promise<Trip | undefined> {
    return this.trips.get(id);
  }

  async getTripsByUser(userId: string): Promise<Trip[]> {
    return Array.from(this.trips.values()).filter(trip => trip.userId === userId);
  }

  async createTrip(tripData: InsertTrip & { userId: string }): Promise<Trip> {
    const id = randomUUID();
    const trip: Trip = {
      ...tripData,
      id,
      createdAt: new Date(),
    };
    this.trips.set(id, trip);
    return trip;
  }

  async updateTrip(id: string, updates: Partial<Trip>): Promise<Trip | undefined> {
    const trip = this.trips.get(id);
    if (!trip) return undefined;
    
    const updatedTrip = { ...trip, ...updates };
    this.trips.set(id, updatedTrip);
    return updatedTrip;
  }

  // Cart Items
  async getCartItems(tripId: string): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(item => item.tripId === tripId);
  }

  async createCartItem(itemData: InsertCartItem): Promise<CartItem> {
    const id = randomUUID();
    const item: CartItem = { 
      ...itemData, 
      id,
      tripId: itemData.tripId || null,
      provider: itemData.provider || null,
      included: itemData.included ?? true,
      dayNumber: itemData.dayNumber || null
    };
    this.cartItems.set(id, item);
    return item;
  }

  async updateCartItem(id: string, updates: Partial<CartItem>): Promise<CartItem | undefined> {
    const item = this.cartItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updates };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteCartItem(id: string): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  
}

export const storage = new MemStorage();
