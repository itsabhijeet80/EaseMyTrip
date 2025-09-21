import { apiRequest } from "./queryClient";
import type { TripRequest, VibesRequest, ChatMessage } from "@shared/schema";

export const api = {
  generateVibes: async (destination: string) => {
    const response = await apiRequest("POST", "/api/vibes", { destination });
    return response.json();
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
};
