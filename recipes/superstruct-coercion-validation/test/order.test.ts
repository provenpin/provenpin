import { test } from "node:test";
import assert from "node:assert/strict";
import { StructError } from "superstruct";
import { Order, parseOrder, orderTotal, explain, is } from "../src/order.ts";

test("coerces form-style strings and applies defaults", () => {
  const order = parseOrder({ email: " ada@example.com ", items: [{ sku: "BOLT-1", qty: "3", price: "2.50" }] });
  assert.equal(order.email, "ada@example.com");
  assert.equal(order.shipping, "standard");
  assert.equal(order.items[0].qty, 3);
  assert.equal(orderTotal(order), 7.5);
});

test("is() checks without coercion", () => {
  assert.equal(is({ email: "a@b.co", shipping: "express", items: [{ sku: "ABC", qty: 1, price: 1 }] }, Order), true);
  assert.equal(is({ email: "a@b.co", shipping: "express", items: [{ sku: "ABC", qty: "1", price: 1 }] }, Order), false);
});

test("failures report path and refinement", () => {
  const msgs = explain({ email: "nope", shipping: "drone", items: [{ sku: "X", qty: "0", price: "-1" }] });
  assert.ok(msgs.includes("email: email"), msgs.join(", "));
  assert.ok(msgs.includes("shipping: enums"), msgs.join(", "));
  assert.ok(msgs.includes("items.0.sku: size"), msgs.join(", "));
  assert.ok(msgs.includes("items.0.qty: min"), msgs.join(", "));
});

test("throws StructError for empty items", () => {
  assert.throws(() => parseOrder({ email: "a@b.co", items: [] }), StructError);
});
