import { create } from "zustand";
import type { User, Product } from "../types";

interface AppState {
  user: User | null;
  products: Product[];
  setUser: (user: User | null) => void;
  setProducts: (products: Product[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  products: [],
  setUser: (user) => set({ user }),
  setProducts: (products) => set({ products }),
}));
