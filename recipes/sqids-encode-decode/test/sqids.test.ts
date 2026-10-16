import { test } from "node:test";
import assert from "node:assert/strict";
import { createSqids, decodeId, encodeNumbers } from "../src/sqids.ts";

test("roundtrips a list of non-negative numbers", () => {
  const sqids = createSqids();
  const numbers = [1, 2, 3, 4, 5];
  const id = encodeNumbers(sqids, numbers);
  assert.equal(typeof id, "string");
  assert.ok(id.length > 0);
  assert.deepEqual(decodeId(sqids, id), numbers);
});

test("different number lists produce different ids", () => {
  const sqids = createSqids();
  const a = encodeNumbers(sqids, [1, 2, 3]);
  const b = encodeNumbers(sqids, [3, 2, 1]);
  const c = encodeNumbers(sqids, [1, 2, 4]);
  assert.notEqual(a, b);
  assert.notEqual(a, c);
  assert.notEqual(b, c);
  assert.deepEqual(decodeId(sqids, a), [1, 2, 3]);
  assert.deepEqual(decodeId(sqids, b), [3, 2, 1]);
  assert.deepEqual(decodeId(sqids, c), [1, 2, 4]);
});

test("custom alphabet and minLength are honored", () => {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const sqids = createSqids({ alphabet, minLength: 10 });
  const id = encodeNumbers(sqids, [10, 20, 30]);
  assert.ok(id.length >= 10);
  for (const ch of id) {
    assert.ok(alphabet.includes(ch));
  }
  assert.deepEqual(decodeId(sqids, id), [10, 20, 30]);
});

test("configurations with different alphabets diverge", () => {
  const lower = createSqids({ alphabet: "abcdefghijklmnopqrstuvwxyz" });
  const mixed = createSqids({ alphabet: "0123456789abcdefghijklmnopqrstuvwxyz" });
  const a = encodeNumbers(lower, [1, 2, 3]);
  const b = encodeNumbers(mixed, [1, 2, 3]);
  assert.notEqual(a, b);
  assert.deepEqual(decodeId(lower, a), [1, 2, 3]);
  assert.deepEqual(decodeId(mixed, b), [1, 2, 3]);
});
