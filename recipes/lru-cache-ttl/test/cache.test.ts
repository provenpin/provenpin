import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { createUserCache } from "../src/cache.ts";

test("evicts least recently used when full", () => {
  const cache = createUserCache(2, 60_000);
  cache.set({ id: "a", name: "Ada" });
  cache.set({ id: "b", name: "Bob" });
  cache.get("a");
  cache.set({ id: "c", name: "Cid" });
  assert.equal(cache.get("b"), undefined);
  assert.equal(cache.get("a")?.name, "Ada");
  assert.equal(cache.size(), 2);
});

test("expires entries after TTL with fake timers", async () => {
  mock.timers.enable({ apis: ["Date", "setTimeout"], now: 1_000 });
  const cache = createUserCache(10, 5_000);
  cache.set({ id: "a", name: "Ada" });
  assert.equal(cache.get("a")?.name, "Ada");
  mock.timers.tick(6_000);
  assert.equal(cache.get("a"), undefined);
  mock.timers.reset();
});

test("getOrFetch populates once", async () => {
  const cache = createUserCache();
  let calls = 0;
  const fetch = async (id: string) => {
    calls++;
    return { id, name: "Ada" };
  };
  assert.equal((await cache.getOrFetch("a", fetch)).name, "Ada");
  assert.equal((await cache.getOrFetch("a", fetch)).name, "Ada");
  assert.equal(calls, 1);
});
