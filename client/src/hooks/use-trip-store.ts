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
  isAIOptionsOpen: boolean;
  isAITalkOpen: boolean;
  selectedDay: number;
  pendingAction: PendingAction | null;
  modificationHistory: any[];
  
  setCurrentTrip: (trip: Trip | null) => void;
  setCartItems: (items: CartItem[]) => void;
  setIsLoading: (loading: boolean) => void;
  setIsChatOpen: (open: boolean) => void;
  setIsAIOptionsOpen: (open: boolean) => void;
  setIsAITalkOpen: (open: boolean) => void;
  setSelectedDay: (day: number) => void;
  setPendingAction: (action: PendingAction | null) => void;
  
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
  isAIOptionsOpen: false,
  isAITalkOpen: false,
  selectedDay: 1,
  pendingAction: null,
  modificationHistory: [],
  
  setCurrentTrip: (trip) => set({ currentTrip: trip }),
  setCartItems: (items) => set({ cartItems: items }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsChatOpen: (open) => set({ isChatOpen: open }),
  setIsAIOptionsOpen: (open) => set({ isAIOptionsOpen: open }),
  setIsAITalkOpen: (open) => set({ isAITalkOpen: open }),
  setSelectedDay: (day) => set({ selectedDay: day }),
  setPendingAction: (action) => set({ pendingAction: action }),
  
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
