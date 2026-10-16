import { test } from "node:test";
import assert from "node:assert/strict";
import jsonLogic from "json-logic-js";
import { rules, volumeDiscountRule, evaluate } from "../src/rules.ts";

test("and combines comparison predicates", () => {
  assert.equal(jsonLogic.apply(rules.freeShipping, { total: 150, country: "US" }), true);
  assert.equal(jsonLogic.apply(rules.freeShipping, { total: 150, country: "CA" }), false);
  assert.equal(jsonLogic.apply(rules.freeShipping, { total: 50, country: "US" }), false);
});

test("or combines predicates and in matches array values", () => {
  assert.equal(jsonLogic.apply(rules.needsReview, { total: 1500, country: "US" }), true);
  assert.equal(jsonLogic.apply(rules.needsReview, { total: 20, country: "KP" }), true);
  assert.equal(jsonLogic.apply(rules.needsReview, { total: 20, country: "US" }), false);
});

test("var reads nested paths and falls back to a default", () => {
  assert.equal(jsonLogic.apply(rules.customerAge, { customer: { age: 30 } }), 30);
  assert.equal(jsonLogic.apply(rules.customerAge, { customer: {} }), 0);
  assert.equal(jsonLogic.apply(rules.customerAge, {}), 0);
});

test("in returns false when the array is absent", () => {
  assert.equal(evaluate(rules.isGiftOrder, { items: ["gift", "book"] }), true);
  assert.equal(evaluate(rules.isGiftOrder, { items: ["book"] }), false);
  assert.equal(evaluate(rules.isGiftOrder, {}), false);
});

test("if picks the first matching branch", () => {
  assert.equal(jsonLogic.apply(rules.shipping, { isDigital: true, total: 5 }), "digital-delivery");
  assert.equal(jsonLogic.apply(rules.shipping, { total: 150 }), "free-shipping");
  assert.equal(jsonLogic.apply(rules.shipping, { total: 20 }), "paid-shipping");
});

test("custom operation applies tiered volume discount", () => {
  assert.equal(jsonLogic.apply(volumeDiscountRule, { quantity: 120, unitPrice: 10 }), 960);
  assert.equal(jsonLogic.apply(volumeDiscountRule, { quantity: 10, unitPrice: 10 }), 90);
  assert.equal(jsonLogic.apply(volumeDiscountRule, { quantity: 3, unitPrice: 10 }), 30);
});
