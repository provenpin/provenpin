import { test } from "node:test";
import assert from "node:assert/strict";
import { assertAlphabet, newSessionId, newTempId, orderId, shortCode } from "../src/ids.ts";

test("session ids are unique and fixed length", () => {
  const a = new Set(Array.from({ length: 50 }, () => newSessionId()));
  assert.equal(a.size, 50);
  for (const id of a) assert.equal(id.length, 21);
});

test("custom alphabets stick to their charset", () => {
  const o = orderId();
  assert.equal(o.length, 10);
  assertAlphabet(o, "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ");
  const s = shortCode();
  assert.equal(s.length, 6);
  assertAlphabet(s, "abcdefghijkmnopqrstuvwxyz");
});

test("nonSecure works synchronously", () => {
  assert.equal(newTempId().length, 12);
});
