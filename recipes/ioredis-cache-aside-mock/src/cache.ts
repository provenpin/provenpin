import type { Redis } from "ioredis";

export function createCache(redis: Redis, prefix = "cache:") {
  const inflight = new Map<string, Promise<unknown>>();
  return {
    async getOrSet<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
      const k = prefix + key;
      const hit = await redis.get(k);
      if (hit !== null) return JSON.parse(hit) as T;
      // single flight: concurrent misses share one load
      if (!inflight.has(k)) {
        inflight.set(k, (async () => {
          try {
            const value = await load();
            await redis.set(k, JSON.stringify(value), "EX", ttlSeconds);
            return value;
          } finally { inflight.delete(k); }
        })());
      }
      return inflight.get(k) as Promise<T>;
    },
    invalidate: (key: string) => redis.del(prefix + key),
    ttl: (key: string) => redis.ttl(prefix + key),
  };
}
