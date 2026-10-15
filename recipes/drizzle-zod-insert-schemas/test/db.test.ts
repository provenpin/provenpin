import { test } from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { createDb, addProduct } from "../src/db.ts";

test("valid input is inserted", () => {
  const p = addProduct(createDb(), { name: "Mug", priceCents: 1299, sku: "MUG-0001" });
  assert.deepEqual(p, { id: 1, name: "Mug", priceCents: 1299, sku: "MUG-0001" });
});

test("invalid input never reaches the database", () => {
  const db = createDb();
  assert.throws(() => addProduct(db, { name: "M", priceCents: -1, sku: "bad" }), ZodError);
  assert.throws(() => addProduct(db, { name: "Mug", priceCents: 5 }), ZodError);
});
