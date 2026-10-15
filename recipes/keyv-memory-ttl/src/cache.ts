import Keyv from "keyv";

export function createMemoryCache(namespace = "demo") {
  return new Keyv({ namespace });
}

export async function setWithTtl<T>(cache: Keyv, key: string, value: T, ttlMs: number) {
  await cache.set(key, value, ttlMs);
}

export async function getValue<T>(cache: Keyv, key: string) {
  return (await cache.get(key)) as T | undefined;
}
