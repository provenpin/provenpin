import { test } from "node:test";
import assert from "node:assert/strict";
import { generateTypes, orderSchema } from "../src/codegen.ts";

test("generates interfaces with required, optional and enum fields", async () => {
  const ts = await generateTypes(orderSchema, "Order");
  assert.match(ts, /^\/\* Generated from JSON Schema\. Do not edit\. \*\//);
  assert.match(ts, /export interface Order \{/);
  assert.match(ts, /\n\s+id: string;/);
  assert.match(ts, /status: "pending" \| "paid" \| "shipped";/);
  assert.match(ts, /note\?: string;/);
  assert.match(ts, /items: \[LineItem, \.\.\.LineItem\[\]\];/);
});

test("$ref definitions become their own interfaces", async () => {
  const ts = await generateTypes(orderSchema, "Order");
  assert.match(ts, /export interface LineItem \{/);
  assert.match(ts, /sku: string;/);
  assert.match(ts, /qty: number;/);
  assert.doesNotMatch(ts, /\[k: string\]: unknown/);
});

test("descriptions become JSDoc comments", async () => {
  const ts = await generateTypes(orderSchema, "Order");
  assert.match(ts, /\/\*\*\n\s+\* Order id, e\.g\. ord_123\n\s+\*\/\n\s+id: string;/);
});

test("open objects keep an index signature when allowed", async () => {
  const ts = await generateTypes({ title: "Meta", type: "object", additionalProperties: true, properties: { a: { type: "number" } } }, "Meta");
  // strictIndexSignatures adds "| undefined" so lookups by unknown keys stay honest.
  assert.match(ts, /\[k: string\]: unknown \| undefined;/);
});
