import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveKey, deriveKeySync } from "../src/kdf.ts";

const FAST = { N: 1024, r: 8, p: 1, dkLen: 32 } as const;
const SLOW = { N: 16384, r: 8, p: 1, dkLen: 64 } as const;

test("sync and async outputs are identical and deterministic", async () => {
  const sync = deriveKeySync("hunter2", "salt", FAST);
  assert.equal(sync, deriveKeySync("hunter2", "salt", FAST));
  assert.equal(sync, await deriveKey("hunter2", "salt", FAST));
  assert.match(sync, /^[0-9a-f]{64}$/);
});

test("different salts produce different keys", async () => {
  const a = await deriveKey("hunter2", "salt-a", FAST);
  const b = await deriveKey("hunter2", "salt-b", FAST);
  assert.notEqual(a, b);
});

test("higher cost params still return a stable hex key", async () => {
  const hex = deriveKeySync("password", "NaCl", SLOW);
  assert.match(hex, /^[0-9a-f]{128}$/);
  assert.equal(hex, deriveKeySync("password", "NaCl", SLOW));
  assert.equal(hex, await deriveKey("password", "NaCl", SLOW));
});

test("password changes the derived key", () => {
  const a = deriveKeySync("password-a", "NaCl", FAST);
  const b = deriveKeySync("password-b", "NaCl", FAST);
  assert.notEqual(a, b);
});
