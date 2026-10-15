import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { createTestingPinia } from "@pinia/testing";
import { mount } from "@vue/test-utils";
import { useCart } from "../src/cart";
import { CartBadge } from "../src/CartBadge";

describe("store", () => {
  beforeEach(() => setActivePinia(createPinia())); // fresh store per test
  it("adds and totals", () => {
    const cart = useCart();
    cart.add("mug", 10); cart.add("mug", 10); cart.add("tee", 25);
    expect(cart.total).toBe(45);
  });
  it("checkout clears items", async () => {
    const cart = useCart();
    cart.add("mug", 10);
    expect(await cart.checkout(async () => "ord_1")).toBe("ord_1");
    expect(cart.items).toEqual([]);
  });
});

describe("component", () => {
  it("renders from initial state with stubbed actions", async () => {
    const w = mount(CartBadge, { global: { plugins: [createTestingPinia({ createSpy: vi.fn, initialState: { cart: { items: [{ sku: "tee", price: 25, qty: 2 }] } } })] } });
    expect(w.get("[data-test=total]").text()).toBe("$50");
    await w.get("button").trigger("click");
    expect(useCart().add).toHaveBeenCalledWith("mug", 10);
    expect(w.get("[data-test=total]").text()).toBe("$50"); // actions are stubbed
  });
  it("real actions with stubActions: false", async () => {
    const w = mount(CartBadge, { global: { plugins: [createTestingPinia({ createSpy: vi.fn, stubActions: false })] } });
    await w.get("button").trigger("click");
    expect(w.get("[data-test=total]").text()).toBe("$10");
  });
});
