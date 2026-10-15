import { describe, it, expect, beforeEach } from "vitest";
import type { StateStorage } from "zustand/middleware";
import { createCartStore, total } from "../src/cart";

let mem: Record<string, string>;
const storage: StateStorage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; }, removeItem: (k) => { delete mem[k]; } };
beforeEach(() => { mem = {}; });

describe("cart store", () => {
  it("adds, merges quantities and totals", () => {
    const s = createCartStore(storage);
    s.getState().add("mug", 10); s.getState().add("mug", 10); s.getState().add("tee", 25);
    expect(s.getState().items).toEqual([{ sku: "mug", price: 10, qty: 2 }, { sku: "tee", price: 25, qty: 1 }]);
    expect(total(s.getState())).toBe(45);
  });

  it("persists only data, not actions", () => {
    const s = createCartStore(storage);
    s.getState().add("mug", 10);
    expect(JSON.parse(mem.cart)).toEqual({ state: { items: [{ sku: "mug", price: 10, qty: 1 }] }, version: 0 });
  });

  it("rehydrates from storage", () => {
    createCartStore(storage).getState().add("tee", 25);
    expect(createCartStore(storage).getState().items).toHaveLength(1);
  });

  it("notifies subscribers", () => {
    const s = createCartStore(storage);
    const seen: number[] = [];
    s.subscribe((st) => seen.push(st.items.length));
    s.getState().add("a", 1); s.getState().clear();
    expect(seen).toEqual([1, 0]);
  });
});
