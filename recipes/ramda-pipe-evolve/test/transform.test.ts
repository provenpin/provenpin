import { test } from "node:test";
import assert from "node:assert/strict";
import { prepareUser, summarize } from "../src/transform.ts";

test("evolve normalizes fields", () => {
  const out = prepareUser({ name: "  Ada ", score: 5, tags: ["A", "B"] });
  assert.deepEqual(out, { name: "ada", score: 15, tags: ["a", "b"] });
});

test("pipe builds a summary", () => {
  const s = summarize({ name: "Bob", score: 1, tags: ["x"] });
  assert.deepEqual(s, { label: "bob:11", tagCount: 1 });
});
