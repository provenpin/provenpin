import { test } from "node:test";
import assert from "node:assert/strict";
import { summarize, type Row } from "../src/report.ts";

const rows: Row[] = [
  { id: "1", region: "west", sku: "A", qty: 2, price: 10 },
  { id: "1", region: "west", sku: "A", qty: 2, price: 10 },
  { id: "2", region: "east", sku: "B", qty: 5, price: 3 },
  { id: "3", region: "west", sku: "C", qty: 1, price: 50 },
];

test("dedupes and totals by region", () => {
  const report = summarize(rows);
  assert.deepEqual(report.totals, { west: 70, east: 15 });
  assert.equal(report.top[0].sku, "C");
  assert.equal(report.get("2")?.sku, "B");
});
