import { test } from "node:test";
import assert from "node:assert/strict";
import { setTimeout as sleep } from "node:timers/promises";
import { createMemoryCache, getValue, setWithTtl } from "../src/cache.ts";

test("stores and retrieves values", async () => {
  const cache = createMemoryCache("t1");
  await setWithTtl(cache, "user", { id: 1 }, 5000);
  assert.deepEqual(await getValue(cache, "user"), { id: 1 });
  await cache.disconnect();
});

test("ttl expires entries", async () => {
  const cache = createMemoryCache("t2");
  await setWithTtl(cache, "temp", "x", 80);
  assert.equal(await getValue(cache, "temp"), "x");
  await sleep(150);
  assert.equal(await getValue(cache, "temp"), undefined);
  await cache.disconnect();
});
