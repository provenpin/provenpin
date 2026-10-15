import { test } from "node:test";
import assert from "node:assert/strict";
import { createLockedCounter } from "../src/locked.ts";

test("mutex serializes concurrent increments", async () => {
  const counter = createLockedCounter();
  await Promise.all(Array.from({ length: 50 }, () => counter.increment()));
  assert.equal(counter.get(), 50);
});
