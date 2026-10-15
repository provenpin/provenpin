import { createId, init, isCuid } from "@paralleldrive/cuid2";

export { createId, isCuid };

export function createIdWithLength(length: number): () => string {
  return init({ length });
}

export function generateMany(count: number, makeId: () => string = createId): string[] {
  return Array.from({ length: count }, () => makeId());
}
