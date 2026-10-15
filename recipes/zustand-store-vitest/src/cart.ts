import { createStore } from "zustand/vanilla";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";

export type Item = { sku: string; price: number; qty: number };
type CartState = {
  items: Item[];
  add: (sku: string, price: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
};

export const total = (s: Pick<CartState, "items">) => s.items.reduce((n, i) => n + i.price * i.qty, 0);

// Use createStore for logic/tests; in React wrap it with useStore(store, selector).
export function createCartStore(storage: StateStorage) {
  return createStore<CartState>()(persist((set) => ({
    items: [],
    add: (sku, price) => set((s) => {
      const hit = s.items.find((i) => i.sku === sku);
      return { items: hit ? s.items.map((i) => (i.sku === sku ? { ...i, qty: i.qty + 1 } : i)) : [...s.items, { sku, price, qty: 1 }] };
    }),
    remove: (sku) => set((s) => ({ items: s.items.filter((i) => i.sku !== sku) })),
    clear: () => set({ items: [] }),
  }), { name: "cart", storage: createJSONStorage(() => storage), partialize: (s) => ({ items: s.items }) }));
}
