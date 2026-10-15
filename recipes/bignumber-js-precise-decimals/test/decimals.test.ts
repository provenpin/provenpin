import { test } from "node:test";
import assert from "node:assert/strict";
import {
  add,
  multiply,
  round,
  formatFixed,
  compare,
  cartTotal,
} from "../src/decimals.ts";

test("0.1 + 0.2 is exact", () => {
  assert.equal(add(0.1, 0.2).toFixed(), "0.3");
  assert.notEqual(0.1 + 0.2, 0.3);
  assert.equal(add("0.1", "0.2").toString(), "0.3");
});

test("multiply avoids binary float drift", () => {
  assert.equal(multiply("1.1", "1.1").toFixed(), "1.21");
  assert.equal(multiply(0.07, 100).toFixed(), "7");
});

test("honours the requested rounding mode", () => {
  assert.equal(round("2.345", 2, "half-up").toFixed(2), "2.35");
  assert.equal(round("2.345", 2, "half-even").toFixed(2), "2.34");
  assert.equal(round("2.355", 2, "half-even").toFixed(2), "2.36");
  assert.equal(round("2.341", 2, "down").toFixed(2), "2.34");
  assert.equal(round("2.341", 2, "up").toFixed(2), "2.35");
  assert.equal(round("-2.341", 2, "floor").toFixed(2), "-2.35");
  assert.equal(round("2.341", 2, "ceil").toFixed(2), "2.35");
});

test("fixed-point formatting", () => {
  assert.equal(formatFixed("1.005", 2, "half-up"), "1.01");
  assert.equal(formatFixed("1.005", 2, "half-even"), "1.00");
  assert.equal(formatFixed("1", 4), "1.0000");
  assert.equal(formatFixed("-0.5", 0, "half-up"), "-1");
});

test("numeric comparisons ignore formatting", () => {
  assert.equal(compare("0.1", "0.10"), 0);
  assert.equal(compare("10", "2"), 1);
  assert.equal(compare("2", "10"), -1);
  assert.equal(compare("0.30000000000000004", "0.3"), 1);
});

test("cart total applies tax and rounds to cents", () => {
  const cart = [
    { name: "Coffee", price: "2.50", qty: 3 },
    { name: "Bagel", price: "1.10", qty: 2 },
  ];
  assert.equal(cartTotal(cart), "9.70");
  assert.equal(cartTotal(cart, "0.08"), "10.48");
});

test("cart total is exact for values that drift in binary", () => {
  const cart = [
    { name: "A", price: "0.1", qty: 1 },
    { name: "B", price: "0.2", qty: 1 },
  ];
  assert.equal(cartTotal(cart), "0.30");
});
