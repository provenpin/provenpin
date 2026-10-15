import { test } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { authorizeCredentials, buildAuthOptions, type UserRepo } from "../src/auth.ts";

const hash = bcrypt.hashSync("correct horse", 4);
const repo: UserRepo = { findByEmail: async (e) => (e === "ada@example.com" ? { id: "u1", email: e, passwordHash: hash, role: "admin" } : null) };

test("authorize accepts good credentials (case-insensitive email)", async () => {
  assert.deepEqual(await authorizeCredentials(repo, { email: "ADA@example.com", password: "correct horse" }), { id: "u1", email: "ada@example.com", role: "admin" });
});

test("authorize rejects bad password, unknown user and missing fields", async () => {
  assert.equal(await authorizeCredentials(repo, { email: "ada@example.com", password: "nope" }), null);
  assert.equal(await authorizeCredentials(repo, { email: "x@example.com", password: "correct horse" }), null);
  assert.equal(await authorizeCredentials(repo, undefined), null);
});

test("role flows user -> jwt -> session", async () => {
  const opts = buildAuthOptions(repo);
  assert.equal(opts.session?.strategy, "jwt");
  const token = await opts.callbacks!.jwt!({ token: { sub: "u1" }, user: { id: "u1", role: "admin" } as any } as any);
  assert.equal(token.role, "admin");
  const later = await opts.callbacks!.jwt!({ token } as any); // subsequent calls have no user
  assert.equal(later.role, "admin");
  const session = await opts.callbacks!.session!({ session: { user: { email: "ada@example.com" }, expires: "" }, token: later } as any);
  assert.deepEqual((session as any).user, { email: "ada@example.com", id: "u1", role: "admin" });
});

test("credentials provider is wired with our authorize", async () => {
  const p: any = buildAuthOptions(repo).providers[0];
  assert.equal(p.id, "credentials");
  const user = await p.options.authorize({ email: "ada@example.com", password: "correct horse" }, {});
  assert.equal(user.id, "u1");
});
