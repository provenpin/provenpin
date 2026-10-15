import { test } from "node:test";
import assert from "node:assert/strict";
import { createAppCache, getMany, setMany } from "../src/cache.ts";

test("set and get roundtrip", async () => {
  const cache = createAppCache();
  await cache.set("user", { id: 7 });
  assert.deepEqual(await cache.get("user"), { id: 7 });
  await cache.del("user");
  assert.equal(await cache.get("user"), undefined);
  await cache.disconnect();
});

test("mset and mget roundtrip", async () => {
  const cache = createAppCache();
  await setMany(cache, [
    { key: "a", value: 1 },
    { key: "b", value: 2 },
  ]);
  assert.deepEqual(await getMany(cache, ["a", "b"]), [1, 2]);
  await cache.clear();
  assert.deepEqual(await getMany(cache, ["a", "b"]), [undefined, undefined]);
  await cache.disconnect();
});
