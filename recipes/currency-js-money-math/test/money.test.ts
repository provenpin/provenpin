import { test } from "node:test";
import assert from "node:assert/strict";
import { money, add, subtract, multiply, distribute, format } from "../src/money.ts";

test("constructs from string and number", () => {
  assert.equal(money("12.34").value, 12.34);
  assert.equal(money(12.34).value, 12.34);
  assert.equal(money("0.1").intValue, 10);
});

test("adds precise cents with no floating point drift", () => {
  assert.notEqual(0.1 + 0.2, 0.3);
  assert.equal(add("0.1", "0.2").value, 0.3);
  assert.equal(add(0.1, 0.2).value, 0.3);
  assert.equal(money(0.1).add(0.2).format(), "$0.30");
});

test("subtracts precise cents with no floating point drift", () => {
  assert.notEqual(0.3 - 0.1, 0.2);
  assert.equal(subtract("0.3", "0.1").value, 0.2);
  assert.equal(subtract(0.3, 0.1).value, 0.2);
});

test("multiplies to whole cents", () => {
  assert.notEqual(1.1 * 3, 3.3);
  assert.equal(multiply("19.99", 3).value, 59.97);
  assert.equal(multiply(1.1, 3).value, 3.3);
});

test("distributes a total into whole cents with no drift", () => {
  const parts = distribute("10", 3);
  assert.equal(parts.length, 3);
  for (const part of parts) {
    assert.equal(part, Number(part.toFixed(2)));
  }
  const total = Number(parts.reduce((sum, part) => sum + part, 0).toFixed(2));
  assert.equal(total, 10);
  assert.deepEqual(distribute(9, 3), [3, 3, 3]);
});

test("formats with symbol and separator options", () => {
  assert.equal(format(1234.5, { symbol: "$", separator: "," }), "$1,234.50");
  assert.equal(format(1234.5, { symbol: "USD ", separator: "," }), "USD 1,234.50");
  assert.equal(format("0.1", { precision: 2 }), "$0.10");
});
