import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, needsRehash, verifyPassword } from "../src/passwords.ts";

test("hash and verify roundtrip", async () => {
  const hash = await hashPassword("correct horse battery");
  assert.equal(await verifyPassword(hash, "correct horse battery"), true);
  assert.equal(await verifyPassword(hash, "wrong"), false);
  assert.equal(needsRehash(hash), false);
});
