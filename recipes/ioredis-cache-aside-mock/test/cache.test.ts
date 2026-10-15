import { describe, it, expect, vi, beforeEach } from "vitest";
import RedisMock from "ioredis-mock";
import type { Redis } from "ioredis";
import { createCache } from "../src/cache";

let redis: Redis;
beforeEach(async () => { redis = new (RedisMock as any)() as Redis; await redis.flushall(); });

describe("cache-aside", () => {
  it("loads once then serves from redis", async () => {
    const cache = createCache(redis);
    const load = vi.fn(async () => ({ id: 1, name: "Ada" }));
    expect(await cache.getOrSet("user:1", 60, load)).toEqual({ id: 1, name: "Ada" });
    expect(await cache.getOrSet("user:1", 60, load)).toEqual({ id: 1, name: "Ada" });
    expect(load).toHaveBeenCalledTimes(1);
    expect(await cache.ttl("user:1")).toBeGreaterThan(0);
  });

  it("concurrent misses share one load", async () => {
    const cache = createCache(redis);
    const load = vi.fn(async () => { await new Promise((r) => setTimeout(r, 10)); return 42; });
    expect(await Promise.all([1, 2, 3].map(() => cache.getOrSet("n", 60, load)))).toEqual([42, 42, 42]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("invalidate forces a reload; failed loads are not cached", async () => {
    const cache = createCache(redis);
    await cache.getOrSet("k", 60, async () => 1);
    await cache.invalidate("k");
    expect(await cache.getOrSet("k", 60, async () => 2)).toBe(2);
    await expect(cache.getOrSet("x", 60, async () => { throw new Error("db down"); })).rejects.toThrow("db down");
    expect(await redis.exists("cache:x")).toBe(0);
  });
});
