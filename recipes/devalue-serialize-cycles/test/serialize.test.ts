import { test } from "node:test";
import assert from "node:assert/strict";
import { stringify } from "devalue";
import { buildGraph, roundTrip } from "../src/serialize.ts";

test("preserves cyclic references as the same object", () => {
  const restored = roundTrip(buildGraph());
  assert.equal(restored.parent, restored);
  assert.equal(restored.peer?.peer, restored.peer);
  assert.equal(restored.peer?.parent, restored);
});

test("preserves repeated references by identity", () => {
  const shared = { id: "shared" };
  const restored = roundTrip({ a: shared, b: shared });
  assert.equal(restored.a, restored.b);
});

test("preserves Date values", () => {
  const when = new Date("2024-01-02T03:04:05.678Z");
  const restored = roundTrip({ when });
  assert.ok(restored.when instanceof Date);
  assert.equal(restored.when.getTime(), when.getTime());
});

test("preserves Map entries", () => {
  const counts = new Map<string, number>([
    ["a", 1],
    ["b", 2],
  ]);
  const restored = roundTrip({ counts });
  assert.ok(restored.counts instanceof Map);
  assert.equal(restored.counts.get("a"), 1);
  assert.equal(restored.counts.get("b"), 2);
});

test("throws when stringifying a function", () => {
  assert.throws(() => stringify({ fn: () => 1 }), /Cannot stringify a function/);
});
