import { test } from "node:test";
import assert from "node:assert/strict";
import { deepEqual, stableHash } from "../src/compare.ts";

test("dequal deep-compares nested objects, arrays, Maps, Sets and Dates", () => {
  const left = {
    id: "u1",
    tags: ["alpha", "beta"],
    profile: { active: true, scores: [1, 2, 3] },
    roles: new Set(["admin", "editor"]),
    limits: new Map([
      ["daily", 10],
      ["monthly", 100],
    ]),
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
  };

  const right = {
    id: "u1",
    tags: ["alpha", "beta"],
    profile: { active: true, scores: [1, 2, 3] },
    roles: new Set(["editor", "admin"]),
    limits: new Map([
      ["monthly", 100],
      ["daily", 10],
    ]),
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
  };

  assert.equal(deepEqual(left, right), true);
});

test("dequal reports inequality for different nested values", () => {
  assert.equal(
    deepEqual({ a: 1, nested: { list: [1, 2] } }, { a: 1, nested: { list: [1, 3] } }),
    false,
  );
  assert.equal(deepEqual(new Set([1, 2]), new Set([1, 3])), false);
  assert.equal(deepEqual(new Map([["a", 1]]), new Map([["a", 2]])), false);
  assert.equal(deepEqual(new Date("2024-01-01"), new Date("2024-01-02")), false);
});

test("stableHash matches equivalent objects regardless of key order", () => {
  const first = { user: { id: "u1", roles: ["admin"] }, nested: { deep: { value: 42 } } };
  const second = { nested: { deep: { value: 42 } }, user: { roles: ["admin"], id: "u1" } };
  assert.equal(stableHash(first), stableHash(second));
});

test("stableHash differs when a nested value changes", () => {
  const base = { user: { id: "u1", roles: ["admin"] }, nested: { deep: { value: 42 } } };
  const changed = { user: { id: "u1", roles: ["admin"] }, nested: { deep: { value: 43 } } };
  assert.notEqual(stableHash(base), stableHash(changed));
});

test("unorderedArrays makes array hashes order independent", () => {
  const first = { ids: [3, 1, 2], name: "x" };
  const second = { ids: [1, 2, 3], name: "x" };
  assert.equal(
    stableHash(first, { unorderedArrays: true }),
    stableHash(second, { unorderedArrays: true }),
  );
  assert.notEqual(stableHash(first), stableHash(second));
});

test("excludeKeys ignores volatile fields", () => {
  const before = { id: "u1", name: "Ada", updatedAt: "2024-01-01T00:00:00.000Z" };
  const after = { id: "u1", name: "Ada", updatedAt: "2024-06-01T00:00:00.000Z" };
  const excludeKeys = (key: string) => key === "updatedAt";
  assert.equal(stableHash(before, { excludeKeys }), stableHash(after, { excludeKeys }));
  assert.notEqual(stableHash(before), stableHash(after));
});
