import { test } from "node:test";
import assert from "node:assert/strict";
import { createId, createIdWithLength, generateMany, isCuid } from "../src/ids.ts";

test("createId returns a 24-character cuid", () => {
  const id = createId();
  assert.equal(typeof id, "string");
  assert.equal(id.length, 24);
});

test("isCuid accepts generated ids", () => {
  for (const id of generateMany(50)) {
    assert.equal(isCuid(id), true);
  }
});

test("isCuid rejects malformed strings", () => {
  assert.equal(isCuid(""), false);
  assert.equal(isCuid("UPPERCASE-NOT-ALLOWED"), false);
  assert.equal(isCuid("has spaces in it"), false);
  assert.equal(isCuid("!@#$%^&*()"), false);
  assert.equal(isCuid("a".repeat(40)), false);
});

test("init generates ids with a custom length", () => {
  const makeShortId = createIdWithLength(10);
  const ids = generateMany(25, makeShortId);
  for (const id of ids) {
    assert.equal(id.length, 10);
  }
});

test("ids are unique across many generations", () => {
  const count = 10_000;
  const ids = generateMany(count);
  assert.equal(new Set(ids).size, count);
});
