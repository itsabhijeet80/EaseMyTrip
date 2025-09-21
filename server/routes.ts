import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tripRequestSchema, vibesRequestSchema, chatMessageSchema } from "@shared/schema";
import { generateVibes, generateTripPlan, chatWithAI } from "./services/gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Generate vibes for destination
  app.post("/api/vibes", async (req, res) => {
    try {
      const { destination } = vibesRequestSchema.parse(req.body);
      const vibes = await generateVibes(destination);
      res.json({ vibes });
    } catch (error) {
      console.error("Error generating vibes:", error);
      res.status(500).json({ error: "Failed to generate vibes" });
    }
  });

  // Generate trip plan
  app.post("/api/generate-trip", async (req, res) => {
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

      // Store the trip (for now, using a dummy user ID)
      const userId = "default-user";
      const trip = await storage.createTrip({
        ...tripRequest,
        userId,
        title: generatedPlan.title,
        days: generatedPlan.days,
      });

      // Create cart items from recommendations
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
                dayNumber: day.day_number,
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

  // Get trip by ID
  app.get("/api/trips/:id", async (req, res) => {
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

  // Get cart items for trip
  app.get("/api/trips/:id/cart", async (req, res) => {
    try {
      const cartItems = await storage.getCartItems(req.params.id);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cart items" });
    }
  });

  // Update cart item
  app.patch("/api/cart/:id", async (req, res) => {
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

  // Delete cart item
  app.delete("/api/cart/:id", async (req, res) => {
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

  // Chat with AI
  app.post("/api/chat", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
