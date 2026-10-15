import { test } from "node:test";
import assert from "node:assert/strict";
import { createAdapter } from "../src/auth.ts";

test("user + linked OAuth account", async () => {
  const a = await createAdapter();
  const u = await a.createUser!({ id: crypto.randomUUID(), email: "ada@example.com", emailVerified: null, name: "Ada" });
  await a.linkAccount!({ userId: u.id, type: "oauth", provider: "github", providerAccountId: "gh_1", access_token: "tok" });
  assert.equal((await a.getUserByAccount!({ provider: "github", providerAccountId: "gh_1" }))?.email, "ada@example.com");
  assert.equal((await a.getUserByEmail!("ada@example.com"))?.id, u.id);
});

test("database session lifecycle", async () => {
  const a = await createAdapter();
  const u = await a.createUser!({ id: crypto.randomUUID(), email: "bo@example.com", emailVerified: null });
  await a.createSession!({ sessionToken: "s1", userId: u.id, expires: new Date(Date.now() + 3600_000) });
  assert.equal((await a.getSessionAndUser!("s1"))?.user.email, "bo@example.com");
  await a.deleteSession!("s1");
  assert.equal(await a.getSessionAndUser!("s1"), null);
});

test("email verification tokens are single-use", async () => {
  const a = await createAdapter();
  const vt = { identifier: "c@example.com", token: "hash", expires: new Date(Date.now() + 60_000) };
  await a.createVerificationToken!(vt);
  assert.equal((await a.useVerificationToken!({ identifier: vt.identifier, token: vt.token }))?.token, "hash");
  assert.equal(await a.useVerificationToken!({ identifier: vt.identifier, token: vt.token }), null);
});
