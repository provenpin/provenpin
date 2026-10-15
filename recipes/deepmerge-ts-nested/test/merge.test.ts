import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeSettings } from "../src/merge.ts";

test("merges nested objects and concatenates arrays", () => {
  const a = { app: { name: "demo", port: 1 }, features: ["a"], nested: { a: 1 } };
  const b = { app: { port: 99 }, features: ["b"], nested: { b: 2 } };
  const out = mergeSettings(a, b as never);
  assert.deepEqual(out.app, { name: "demo", port: 99 });
  assert.deepEqual(out.features, ["a", "b"]);
  assert.deepEqual(out.nested, { a: 1, b: 2 });
  assert.deepEqual(a.features, ["a"]);
});
