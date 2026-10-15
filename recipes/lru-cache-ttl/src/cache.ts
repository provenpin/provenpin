import { LRUCache } from "lru-cache";

export type User = { id: string; name: string };

export function createUserCache(max = 100, ttlMs = 60_000) {
  const cache = new LRUCache<string, User>({
    max,
    ttl: ttlMs,
    // Use Date so node:test fake timers control expiry
    perf: { now: () => Date.now() },
  });

  return {
    get(id: string) {
      return cache.get(id);
    },
    set(user: User) {
      cache.set(user.id, user);
      return user;
    },
    async getOrFetch(id: string, fetch: (id: string) => Promise<User>) {
      const hit = cache.get(id);
      if (hit) return hit;
      const user = await fetch(id);
      cache.set(id, user);
      return user;
    },
    size() {
      return cache.size;
    },
    clear() {
      cache.clear();
    },
  };
}
