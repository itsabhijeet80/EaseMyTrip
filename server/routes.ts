import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tripRequestSchema, vibesRequestSchema, chatMessageSchema } from "@shared/schema";
import { generateVibes, generateTripPlan, chatWithAI, detectTripAction, executeModification, analyzeBudgetOptimization, generateSmartRecommendations, generateUserInsights } from "./services/gemini";

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

  // Detect action from message
  app.post("/api/detect-action", async (req, res) => {
    try {
      const { message, tripId } = req.body;
      
      let tripContext = null;
      if (tripId) {
        tripContext = await storage.getTrip(tripId);
      }
      
      const action = await detectTripAction(message, tripContext);
      res.json(action);
    } catch (error) {
      console.error("Error detecting action:", error);
      res.status(500).json({ error: "Failed to detect action" });
    }
  });

  // Execute trip modification
  app.post("/api/trips/:id/modify", async (req, res) => {
    try {
      const { action, params } = req.body;
      const tripId = req.params.id;
      
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
      
      const result = await executeModification(action, params, trip);
      
      // Update the trip in storage
      const updatedTrip = await storage.updateTrip(tripId, result.modifiedTrip);
      
      res.json({ 
        trip: updatedTrip, 
        changes: result.changes,
        suggestion: result.suggestion 
      });
    } catch (error) {
      console.error("Error modifying trip:", error);
      res.status(500).json({ error: "Failed to modify trip" });
    }
  });

  // Budget optimization
  app.post("/api/trips/:id/optimize-budget", async (req, res) => {
    try {
      const tripId = req.params.id;
      
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
      
      const optimization = await analyzeBudgetOptimization(trip);
      res.json(optimization);
    } catch (error) {
      console.error("Error optimizing budget:", error);
      res.status(500).json({ error: "Failed to optimize budget" });
    }
  });

  // Smart recommendations
  app.post("/api/trips/:id/recommendations", async (req, res) => {
    try {
      const tripId = req.params.id;
      const { dayNumber } = req.body;
      
      const trip = await storage.getTrip(tripId);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
      
      const recommendations = await generateSmartRecommendations(trip, dayNumber);
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ error: "Failed to generate recommendations" });
    }
  });

  // User insights
  app.post("/api/user/insights", async (req, res) => {
    try {
      const { userId } = req.body;
      
      // Get user's trip history
      const trips = await storage.getTripsByUser(userId || "default-user");
      
      const userProfile = {
        trips: trips.length,
        tripHistory: trips.slice(0, 5), // Last 5 trips
        preferences: {
          // Mock data for demo
          favoriteThemes: ["Beach & Chill", "Adventure Sports"],
          averageBudget: 8000,
          destinations: trips.map(t => t.to)
        }
      };
      
      const insights = await generateUserInsights(userProfile);
      res.json(insights);
    } catch (error) {
      console.error("Error generating user insights:", error);
      res.status(500).json({ error: "Failed to generate user insights" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
