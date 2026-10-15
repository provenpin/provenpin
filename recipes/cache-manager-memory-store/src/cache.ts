import { createCache } from "cache-manager";
import Keyv from "keyv";

export function createAppCache(ttl = 5000) {
  return createCache({
    stores: [new Keyv()],
    ttl,
  });
}

export async function setMany(
  cache: ReturnType<typeof createAppCache>,
  entries: Array<{ key: string; value: unknown; ttl?: number }>,
) {
  return cache.mset(entries);
}

export async function getMany(cache: ReturnType<typeof createAppCache>, keys: string[]) {
  return cache.mget(keys);
}
