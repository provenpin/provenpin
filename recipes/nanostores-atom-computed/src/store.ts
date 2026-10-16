import { atom, computed, map } from "nanostores";
import type { MapStore, ReadableAtom, WritableAtom } from "nanostores";

export type LineItem = { sku: string; price: number; qty: number };

export type Cart = {
  taxRate: WritableAtom<number>;
  items: MapStore<Record<string, LineItem>>;
  subtotal: ReadableAtom<number>;
  total: ReadableAtom<number>;
};

export function createCart(initialTaxRate = 0.1): Cart {
  const taxRate = atom(initialTaxRate);
  const items = map<Record<string, LineItem>>({});

  const subtotal = computed(items, (bySku) => {
    let sum = 0;
    for (const item of Object.values(bySku)) {
      sum += item.price * item.qty;
    }
    return Math.round(sum * 100) / 100;
  });

  const total = computed([subtotal, taxRate], (sub, rate) =>
    Math.round(sub * (1 + rate) * 100) / 100,
  );

  return { taxRate, items, subtotal, total };
}
