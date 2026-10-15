import { test } from "node:test";
import assert from "node:assert/strict";
import { revenueByRegion, topSkus, type Sale } from "../src/stats.ts";

const sales: Sale[] = [
  { sku: "A", region: "west", qty: 2, price: 10 },
  { sku: "A", region: "east", qty: 1, price: 10 },
  { sku: "B", region: "west", qty: 5, price: 3 },
  { sku: "C", region: "east", qty: 0, price: 99 },
];

test("revenue by region ignores zero qty", () => {
  assert.deepEqual(revenueByRegion(sales), { west: 35, east: 10 });
});

test("top skus by quantity", () => {
  assert.deepEqual(topSkus(sales, 2), [{ sku: "B", qty: 5 }, { sku: "A", qty: 3 }]);
});
