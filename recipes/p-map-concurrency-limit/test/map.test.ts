import { test } from "node:test";
import assert from "node:assert/strict";
import { doubleAll } from "../src/map.ts";

test("preserves order and respects concurrency", async () => {
  const peaks: number[] = [];
  const { result, maxInflight } = await doubleAll([1, 2, 3, 4, 5, 6], 2, (n) => peaks.push(n));
  assert.deepEqual(result, [2, 4, 6, 8, 10, 12]);
  assert.ok(maxInflight <= 2);
  assert.ok(Math.max(...peaks) <= 2);
});
