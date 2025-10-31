// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  users;
  trips;
  cartItems;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.trips = /* @__PURE__ */ new Map();
    this.cartItems = /* @__PURE__ */ new Map();
  }
  // Users
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  // Trips
  async getTrip(id) {
    return this.trips.get(id);
  }
  async getTripsByUser(userId) {
    return Array.from(this.trips.values()).filter((trip) => trip.userId === userId);
  }
  async createTrip(tripData) {
    const id = randomUUID();
    const trip = {
      ...tripData,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.trips.set(id, trip);
    return trip;
  }
  async updateTrip(id, updates) {
    const trip = this.trips.get(id);
    if (!trip) return void 0;
    const updatedTrip = { ...trip, ...updates };
    this.trips.set(id, updatedTrip);
    return updatedTrip;
  }
  // Cart Items
  async getCartItems(tripId) {
    return Array.from(this.cartItems.values()).filter((item) => item.tripId === tripId);
  }
  async createCartItem(itemData) {
    const id = randomUUID();
    const item = {
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
  async updateCartItem(id, updates) {
    const item = this.cartItems.get(id);
    if (!item) return void 0;
    const updatedItem = { ...item, ...updates };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }
  async deleteCartItem(id) {
    return this.cartItems.delete(id);
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var trips = pgTable("trips", {
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
  createdAt: timestamp("created_at").defaultNow()
});
var cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripId: varchar("trip_id").references(() => trips.id),
  type: text("type").notNull(),
  // 'flight', 'hotel', 'activity'
  title: text("title").notNull(),
  details: text("details").notNull(),
  provider: text("provider"),
  price: integer("price").notNull(),
  included: boolean("included").default(true),
  dayNumber: integer("day_number")
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  userId: true,
  createdAt: true
});
var insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true
});
var tripRequestSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  theme: z.string().min(1),
  budget: z.number().min(1e4).max(5e5)
});
var vibesRequestSchema = z.object({
  destination: z.string().min(1)
});
var chatMessageSchema = z.object({
  message: z.string().min(1),
  tripId: z.string().optional()
});

// server/services/gemini.ts
import { GoogleGenAI } from "@google/genai";
var ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
async function generateVibes(destination) {
  try {
    const prompt = `You are a travel expert. For the destination "${destination}", what are the top 6 most relevant travel themes or "vibes"?
    
    Use Google Search to find popular activities and attractions to determine these themes.
    Return ONLY a valid JSON array of strings, like ["Vibe1", "Vibe2", "Vibe3", "Vibe4", "Vibe5", "Vibe6"]. 
    Do not include any other text, explanation, or markdown formatting. 
    
    For example, for Goa, a good response would be ["Beach & Chill", "Party & Nightlife", "Cultural Exploration", "Adventure Sports", "Food & Dining", "Nature & Wildlife"]. 
    For Rishikesh, it might be ["Spiritual & Yoga", "Adventure Sports", "Trekking & Hiking", "River Rafting", "Nature Retreat", "Meditation"].`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }]
    });
    let jsonString = response.text || "";
    jsonString = jsonString.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    const vibes = JSON.parse(jsonString);
    return Array.isArray(vibes) ? vibes : [];
  } catch (error) {
    console.error("Error generating vibes:", error);
    return ["Adventure", "Relaxation", "Culture", "Food & Dining", "Nature", "Photography"];
  }
}
async function generateTripPlan(from, to, startDate, endDate, theme, budget) {
  try {
    const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString();
    const prompt = `
      Act as an expert travel agent. Today's date is ${currentDate}.
      Your primary task is to use the Google Search tool to find real-time, current pricing and availability for flights and hotels. The prices in your response MUST be based on the search results.

      Create a personalized travel itinerary based on the following details:
      - Departure City: ${from}
      - Destination City: ${to}
      - Start Date: ${startDate}
      - End Date: ${endDate}
      - Trip Vibe/Theme: ${theme}
      - Total Budget: Approximately \u20B9${budget} INR

      **Instructions:**
      1. **Search for Flights:** Perform a Google Search for one-way flights from "${from}" to "${to}" on "${startDate}". Extract a real airline, flight number, and its current price in INR.
      2. **Search for Hotels:** Perform a Google Search for hotels in "${to}" available from "${startDate}" to "${endDate}" that match the "${theme}" vibe. Find a real hotel and its price per night. Calculate the total price for the duration of the stay.
      3. **Search for Activities:** Perform a Google Search for activities in "${to}" that match the "${theme}" vibe. Find 2-3 relevant activities per day and their estimated costs in INR.
      4. **Construct the JSON response:** Use the information and prices gathered from your searches to build the itinerary. Ensure the sum of all prices is close to the user's total budget.

      **Output Format:**
      Return ONLY a valid JSON object with the exact following structure. Do not include any text, explanation, or markdown formatting before or after the JSON.
      {
        "title": "A creative and fitting title for the trip",
        "days": [
          {
            "day_number": 1,
            "theme": "A theme for this specific day",
            "ai_summary": "A short, engaging summary of the plan for this day.",
            "recommendations": [
              { "type": "flight", "title": "Flight from ${from} to ${to}", "details": "Airline and flight number from search", "provider": "Airline Name from search", "price": 280 },
              { "type": "hotel", "title": "Hotel Name from search", "details": "Brief description of the hotel", "provider": "Booking Site found in search", "price": 960 },
              { "type": "activity", "title": "Activity Name from search", "details": "Description of the activity", "provider": "Tour Operator", "price": 50 }
            ]
          }
        ]
      }
    `;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }]
    });
    let jsonString = response.text || "";
    jsonString = jsonString.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error generating trip plan:", error);
    throw new Error("Failed to generate trip plan");
  }
}
async function chatWithAI(message, tripContext) {
  try {
    let prompt = `You are a helpful AI travel assistant. The user is asking: "${message}"`;
    if (tripContext) {
      prompt += `

Context: The user has a trip planned: ${JSON.stringify(tripContext)}`;
    }
    prompt += `

Provide a helpful, concise response. If the user is asking to modify their trip, provide specific suggestions.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }]
    });
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Error in chat:", error);
    return "I'm sorry, I'm having trouble right now. Please try again.";
  }
}

// server/routes.ts
async function registerRoutes(app2) {
  app2.post("/api/vibes", async (req, res) => {
    try {
      const { destination } = vibesRequestSchema.parse(req.body);
      const vibes = await generateVibes(destination);
      res.json({ vibes });
    } catch (error) {
      console.error("Error generating vibes:", error);
      res.status(500).json({ error: "Failed to generate vibes" });
    }
  });
  app2.post("/api/generate-trip", async (req, res) => {
    try {
      const tripRequest = tripRequestSchema.parse(req.body);
      const generatedPlan = await generateTripPlan(
        tripRequest.from,
        tripRequest.to,
        tripRequest.startDate,
        tripRequest.endDate,
        tripRequest.theme,
        tripRequest.budget
      );
      const userId = "default-user";
      const trip = await storage.createTrip({
        ...tripRequest,
        userId,
        title: generatedPlan.title,
        days: generatedPlan.days
      });
      if (generatedPlan.days) {
        for (const day of generatedPlan.days) {
          if (day.recommendations) {
            for (const rec of day.recommendations) {
              await storage.createCartItem({
                tripId: trip.id,
                type: rec.type,
                title: rec.title,
                details: rec.details,
                provider: rec.provider,
                price: rec.price,
                included: true,
                dayNumber: day.day_number
              });
            }
          }
        }
      }
      res.json({ trip, plan: generatedPlan });
    } catch (error) {
      console.error("Error generating trip:", error);
      res.status(500).json({ error: "Failed to generate trip plan" });
    }
  });
  app2.get("/api/trips/:id", async (req, res) => {
    try {
      const trip = await storage.getTrip(req.params.id);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
      res.json(trip);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trip" });
    }
  });
  app2.get("/api/trips/:id/cart", async (req, res) => {
    try {
      const cartItems2 = await storage.getCartItems(req.params.id);
      res.json(cartItems2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cart items" });
    }
  });
  app2.patch("/api/cart/:id", async (req, res) => {
    try {
      const updatedItem = await storage.updateCartItem(req.params.id, req.body);
      if (!updatedItem) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ error: "Failed to update cart item" });
    }
  });
  app2.delete("/api/cart/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCartItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete cart item" });
    }
  });
  app2.post("/api/chat", async (req, res) => {
    try {
      const { message, tripId } = chatMessageSchema.parse(req.body);
      let tripContext = null;
      if (tripId) {
        tripContext = await storage.getTrip(tripId);
      }
      const response = await chatWithAI(message, tripContext);
      res.json({ response });
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0"
  }, () => {
    log(`serving on port ${port}`);
  });
})();
