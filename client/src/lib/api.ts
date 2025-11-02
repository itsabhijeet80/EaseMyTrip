import { apiRequest } from "./queryClient";
import type { TripRequest } from "@shared/schema";

// Simple cache implementation
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCached(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

export const api = {
  generateVibes: async (destination: string) => {
    // Check client-side cache first (additional layer of caching)
    const cacheKey = `vibes-${destination.toLowerCase().trim()}`;
    const cached = getCached(cacheKey);
    if (cached) {
      console.log("Using cached vibes from client cache for:", destination);
      return cached;
    }
    
    console.log("Calling API for vibes with destination:", destination);
    const response = await apiRequest("POST", "/api/vibes", { destination });
    const data = await response.json();
    console.log("Received vibes:", data);
    // Cache the result for 5 minutes on client side (backend also caches for 1 hour)
    setCache(cacheKey, data);
    return data;
  },

  generateTrip: async (tripRequest: TripRequest) => {
    const response = await apiRequest("POST", "/api/generate-trip", tripRequest);
    return response.json();
  },

  getTrip: async (id: string) => {
    const response = await apiRequest("GET", `/api/trips/${id}`);
    return response.json();
  },

  getCartItems: async (tripId: string) => {
    const response = await apiRequest("GET", `/api/trips/${tripId}/cart`);
    return response.json();
  },

  updateCartItem: async (id: string, updates: any) => {
    const response = await apiRequest("PATCH", `/api/cart/${id}`, updates);
    return response.json();
  },

  deleteCartItem: async (id: string) => {
    const response = await apiRequest("DELETE", `/api/cart/${id}`);
    return response.json();
  },

  chat: async (message: string, tripId?: string) => {
    const response = await apiRequest("POST", "/api/chat", { message, tripId });
    return response.json();
  },

  textToSpeech: async (text: string, voiceId?: string): Promise<Blob> => {
    const res = await fetch("/api/text-to-speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceId }),
      credentials: "include",
    });

    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }

    return res.blob();
  },

  detectAction: async (message: string, tripId?: string) => {
    const response = await apiRequest("POST", "/api/detect-action", { message, tripId });
    return response.json();
  },

  detectItineraryPlanning: async (message: string, conversationHistory?: string[]) => {
    const response = await apiRequest("POST", "/api/detect-itinerary-planning", { message, conversationHistory });
    return response.json();
  },

  extractTripDetails: async (message: string, existingDetails?: any, destination?: string) => {
    const response = await apiRequest("POST", "/api/extract-trip-details", { message, existingDetails, destination });
    return response.json();
  },

  modifyTrip: async (tripId: string, action: string, params: any) => {
    const response = await apiRequest("POST", `/api/trips/${tripId}/modify`, { action, params });
    return response.json();
  },

  optimizeBudget: async (tripId: string) => {
    const response = await apiRequest("POST", `/api/trips/${tripId}/optimize-budget`);
    return response.json();
  },

  getRecommendations: async (tripId: string, dayNumber?: number) => {
    const cacheKey = `recommendations-${tripId}-${dayNumber || 'all'}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;
    
    const response = await apiRequest("POST", `/api/trips/${tripId}/recommendations`, { dayNumber });
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  },

  getUserInsights: async (userId?: string) => {
    const cacheKey = `user-insights-${userId || 'default'}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;
    
    const response = await apiRequest("POST", "/api/user/insights", { userId });
    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  },
};
