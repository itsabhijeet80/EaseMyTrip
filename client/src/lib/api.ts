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
    const cacheKey = `vibes-${destination}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;
    
    const response = await apiRequest("POST", "/api/vibes", { destination });
    const data = await response.json();
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

  detectAction: async (message: string, tripId?: string) => {
    const response = await apiRequest("POST", "/api/detect-action", { message, tripId });
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
