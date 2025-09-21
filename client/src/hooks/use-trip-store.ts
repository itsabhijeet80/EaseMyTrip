import { create } from 'zustand';
import type { Trip, CartItem } from '@shared/schema';

interface TripStore {
  currentTrip: Trip | null;
  cartItems: CartItem[];
  isLoading: boolean;
  isChatOpen: boolean;
  selectedDay: number;
  
  setCurrentTrip: (trip: Trip | null) => void;
  setCartItems: (items: CartItem[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsChatOpen: (open: boolean) => void;
  setSelectedDay: (day: number) => void;
  
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  removeCartItem: (id: string) => void;
  
  getTotalCost: () => number;
  getItemCount: () => number;
}

export const useTripStore = create<TripStore>((set, get) => ({
  currentTrip: null,
  cartItems: [],
  isLoading: false,
  isChatOpen: false,
  selectedDay: 1,
  
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setCartItems: (items) => set({ cartItems: items }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsChatOpen: (open) => set({ isChatOpen: open }),
  setSelectedDay: (day) => set({ selectedDay: day }),
  
  updateCartItem: (id, updates) => set((state) => ({
    cartItems: state.cartItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    )
  })),
  
  removeCartItem: (id) => set((state) => ({
    cartItems: state.cartItems.filter(item => item.id !== id)
  })),
  
  getTotalCost: () => {
    const { cartItems } = get();
    return cartItems
      .filter(item => item.included)
      .reduce((total, item) => total + item.price, 0);
  },
  
  getItemCount: () => {
    const { cartItems } = get();
    return cartItems.filter(item => item.included).length;
  },
}));
