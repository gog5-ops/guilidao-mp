import { create } from "zustand";
import type { User, Product } from "../types";

const USER_KEY = "guilidao_user";

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {}
}

interface AppState {
  user: User | null;
  products: Product[];
  setUser: (user: User | null) => void;
  setProducts: (products: Product[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: loadUser(),
  products: [],
  setUser: (user) => { saveUser(user); set({ user }); },
  setProducts: (products) => set({ products }),
}));
