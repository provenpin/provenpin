import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, checkPassword, createSession, readSession } from "../src/auth.ts";

const secret = new TextEncoder().encode("a-32-byte-long-test-secret-value!");

test("hash and verify a password", async () => {
  const h = await hashPassword("hunter2");
  assert.notEqual(h, "hunter2");
  assert.equal(await checkPassword("hunter2", h), true);
  assert.equal(await checkPassword("wrong", h), false);
});

test("session round trip", async () => {
  const t = await createSession("u1", secret);
  assert.deepEqual(await readSession(t, secret), { userId: "u1", role: "user" });
});

test("rejects tampered and expired tokens", async () => {
  const t = await createSession("u1", secret);
  await assert.rejects(readSession(t, new TextEncoder().encode("another-32-byte-long-secret-val!!")));
  const old = await createSession("u1", secret, "-1s");
  await assert.rejects(readSession(old, secret));
});
