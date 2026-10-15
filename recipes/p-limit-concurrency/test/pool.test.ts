import { test } from "node:test";
import assert from "node:assert/strict";
import { mapLimited, createPool } from "../src/pool.ts";

test("never exceeds concurrency", async () => {
  let active = 0;
  let peak = 0;
  const results = await mapLimited([1, 2, 3, 4, 5], 2, async (n) => {
    active++;
    peak = Math.max(peak, active);
    await new Promise((r) => setTimeout(r, 20));
    active--;
    return n * 2;
  });
  assert.deepEqual(results, [2, 4, 6, 8, 10]);
  assert.ok(peak <= 2);
});

test("tracks active and pending counts", async () => {
  const pool = createPool(1);
  const a = pool.run(async () => {
    await new Promise((r) => setTimeout(r, 40));
    return "a";
  });
  const b = pool.run(async () => "b");
  await new Promise((r) => setTimeout(r, 5));
  assert.equal(pool.active(), 1);
  assert.equal(pool.pending(), 1);
  assert.deepEqual(await Promise.all([a, b]), ["a", "b"]);
});
