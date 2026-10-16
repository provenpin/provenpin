import { dequal } from "dequal";
import hash from "object-hash";
import type { HashOptions } from "object-hash";

export function deepEqual(left: unknown, right: unknown): boolean {
  return dequal(left, right);
}

export function stableHash(value: unknown, options: HashOptions = {}): string {
  return hash(value, {
    algorithm: "sha1",
    encoding: "hex",
    unorderedObjects: true,
    unorderedSets: true,
    ...options,
  });
}
