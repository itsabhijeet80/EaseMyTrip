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
  createCartItemsBatch(items: InsertCartItem[]): Promise<CartItem[]>;
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
    const allItems = Array.from(this.cartItems.values());
    const filtered = allItems.filter(item => item.tripId === tripId);
    console.log(`[Storage] getCartItems for trip ${tripId}: Found ${filtered.length} items out of ${allItems.length} total`);
    if (filtered.length === 0 && allItems.length > 0) {
      console.log(`[Storage] All trip IDs in storage:`, [...new Set(allItems.map(i => i.tripId))]);
    }
    return filtered;
  }

  async createCartItem(itemData: InsertCartItem): Promise<CartItem> {
    const id = randomUUID();
    // Validate required fields
    if (!itemData.tripId) {
      throw new Error('tripId is required for cart items');
    }
    if (!itemData.type) {
      throw new Error('type is required for cart items');
    }
    if (!itemData.title) {
      throw new Error('title is required for cart items');
    }
    if (!itemData.details) {
      throw new Error('details is required for cart items');
    }
    
    const item: CartItem = { 
      ...itemData, 
      id,
      tripId: itemData.tripId,
      type: itemData.type,
      title: itemData.title,
      details: itemData.details,
      provider: itemData.provider || null,
      price: typeof itemData.price === 'number' ? itemData.price : (parseInt(String(itemData.price)) || 0),
      included: itemData.included ?? true,
      dayNumber: itemData.dayNumber || null
    };
    
    this.cartItems.set(id, item);
    const totalItems = this.cartItems.size;
    console.log(`[Storage] Created cart item: ${id}`);
    console.log(`  - Trip: ${itemData.tripId}, Day: ${itemData.dayNumber}, Type: ${itemData.type}`);
    console.log(`  - Title: ${itemData.title.substring(0, 50)}`);
    console.log(`  - Total cart items in storage: ${totalItems}`);
    
    // Verify it was stored
    const stored = this.cartItems.get(id);
    if (!stored) {
      throw new Error(`Failed to store cart item ${id}`);
    }
    
    return item;
  }

  async createCartItemsBatch(itemsData: InsertCartItem[]): Promise<CartItem[]> {
    const items: CartItem[] = [];
    
    for (const itemData of itemsData) {
      const id = randomUUID();
      
      // Validate required fields
      if (!itemData.tripId) {
        throw new Error('tripId is required for cart items');
      }
      if (!itemData.type) {
        throw new Error('type is required for cart items');
      }
      if (!itemData.title) {
        throw new Error('title is required for cart items');
      }
      if (!itemData.details) {
        throw new Error('details is required for cart items');
      }
      
      const item: CartItem = { 
        ...itemData, 
        id,
        tripId: itemData.tripId,
        type: itemData.type,
        title: itemData.title,
        details: itemData.details,
        provider: itemData.provider || null,
        price: typeof itemData.price === 'number' ? itemData.price : (parseInt(String(itemData.price)) || 0),
        included: itemData.included ?? true,
        dayNumber: itemData.dayNumber || null
      };
      
      this.cartItems.set(id, item);
      items.push(item);
    }
    
    console.log(`[Storage] Created ${items.length} cart items in batch`);
    return items;
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
