import { test } from "node:test";
import assert from "node:assert/strict";
import { atom, map } from "nanostores";
import { createCart } from "../src/store.ts";

test("atom get and set", () => {
  const count = atom(0);
  assert.equal(count.get(), 0);
  count.set(7);
  assert.equal(count.get(), 7);
});

test("map get and setKey", () => {
  const user = map({ name: "Ada", age: 36 });
  assert.equal(user.get().name, "Ada");
  user.setKey("age", 37);
  assert.equal(user.get().age, 37);
  user.set({ name: "Grace", age: 45 });
  assert.deepEqual(user.get(), { name: "Grace", age: 45 });
});

test("subscribe fires immediately and stops after unsubscribe", () => {
  const count = atom(1);
  const seen: number[] = [];
  const off = count.subscribe((value) => seen.push(value));
  assert.deepEqual(seen, [1]);
  count.set(2);
  assert.deepEqual(seen, [1, 2]);
  off();
  count.set(3);
  assert.deepEqual(seen, [1, 2]);
  assert.equal(count.get(), 3);
});

test("listen skips the initial value and stops after unsubscribe", () => {
  const count = atom(0);
  const seen: number[] = [];
  const off = count.listen((value) => seen.push(value));
  assert.deepEqual(seen, []);
  count.set(1);
  assert.deepEqual(seen, [1]);
  off();
  count.set(2);
  assert.deepEqual(seen, [1]);
});

test("computed derives from atom and map stores and freezes when unsubscribed", () => {
  const cart = createCart(0.1);
  const seen: number[] = [];
  const off = cart.total.listen((value) => seen.push(value));

  cart.items.setKey("a", { sku: "a", price: 10, qty: 2 });
  assert.equal(cart.subtotal.get(), 20);
  assert.equal(cart.total.get(), 22);

  cart.taxRate.set(0.2);
  assert.equal(cart.subtotal.get(), 20);
  assert.equal(cart.total.get(), 24);
  assert.equal(seen[seen.length - 1], 24);

  const notifications = seen.length;
  off();
  cart.items.setKey("b", { sku: "b", price: 5, qty: 1 });
  cart.taxRate.set(0.5);
  // Listeners stop, but the stores themselves keep updating.
  assert.equal(seen.length, notifications);
  assert.equal(cart.subtotal.get(), 25);
  assert.equal(cart.total.get(), 37.5);
});
