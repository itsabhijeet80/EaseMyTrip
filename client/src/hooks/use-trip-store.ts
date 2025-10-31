import { create } from 'zustand';
import type { Trip, CartItem } from '@shared/schema';

interface PendingAction {
  action: string;
  params: any;
  confirmationMessage: string;
  reasoning: string;
}

interface TripStore {
  currentTrip: Trip | null;
  cartItems: CartItem[];
  isLoading: boolean;
  isChatOpen: boolean;
  aiMode: 'voice' | 'text';
  selectedDay: number;
  pendingAction: PendingAction | null;
  modificationHistory: any[];
  upgradeAdded: boolean;
  
  setCurrentTrip: (trip: Trip | null) => void;
  setCartItems: (items: CartItem[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsChatOpen: (open: boolean) => void;
  setAIMode: (mode: 'voice' | 'text') => void;
  setSelectedDay: (day: number) => void;
  setPendingAction: (action: PendingAction | null) => void;
  setUpgradeAdded: (added: boolean) => void;
  
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  removeCartItem: (id: string) => void;
  addModificationToHistory: (modification: any) => void;
  undoLastModification: () => void;
  
  getTotalCost: () => number;
  getItemCount: () => number;
}

export const useTripStore = create<TripStore>((set, get) => ({
  currentTrip: null,
  cartItems: [],
  isLoading: false,
  isChatOpen: false,
  aiMode: 'voice',
  selectedDay: 1,
  pendingAction: null,
  modificationHistory: [],
  upgradeAdded: false,
  
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setCartItems: (items) => set({ cartItems: items }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsChatOpen: (open) => set({ isChatOpen: open }),
  setAIMode: (mode) => set({ aiMode: mode }),
  setSelectedDay: (day) => set({ selectedDay: day }),
  setPendingAction: (action) => set({ pendingAction: action }),
  setUpgradeAdded: (added) => set({ upgradeAdded: added }),
  
  updateCartItem: (id, updates) => set((state) => ({
    cartItems: state.cartItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    )
  })),
  
  removeCartItem: (id) => set((state) => ({
    cartItems: state.cartItems.filter(item => item.id !== id)
  })),
  
  addModificationToHistory: (modification) => set((state) => ({
    modificationHistory: [...state.modificationHistory, modification]
  })),
  
  undoLastModification: () => set((state) => {
    const history = [...state.modificationHistory];
    const lastMod = history.pop();
    if (lastMod?.previousTrip) {
      return {
        currentTrip: lastMod.previousTrip,
        modificationHistory: history
      };
    }
    return { modificationHistory: history };
  }),
  
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
