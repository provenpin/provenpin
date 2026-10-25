import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeBase32IgnorePadding } from "@oslojs/encoding";
import { createSessionStore, enrollTotp, verifyTotp, makeRecoveryCodes, generateTotp, generateHotp } from "../src/auth.ts";

const DAY = 86_400_000;

test("stores only a hash of the session token", () => {
  const store = createSessionStore();
  const token = store.generateToken();
  assert.match(token, /^[a-z2-7]{32}$/);
  const s = store.create(token, "u1");
  assert.notEqual(s.id, token);
  assert.match(s.id, /^[0-9a-f]{64}$/);
  assert.equal(store.validate(token)?.userId, "u1");
  assert.equal(store.validate(s.id), null); // the stored hash is not a usable token
});

test("sessions slide, expire and can be revoked per user", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-10-01T00:00:00Z") });
  const store = createSessionStore();
  const a = store.generateToken(), b = store.generateToken();
  store.create(a, "u1"); store.create(b, "u1");
  t.mock.timers.tick(20 * DAY);
  const slid = store.validate(a);
  assert.equal(slid?.expiresAt.toISOString(), "2026-11-20T00:00:00.000Z"); // extended by 30 days from day 20
  t.mock.timers.tick(31 * DAY);
  assert.equal(store.validate(a), null);
  assert.equal(store.sessions.size, 1);
  store.invalidateAllForUser("u1");
  assert.equal(store.sessions.size, 0);
});

test("TOTP enrolment URI and manual key encode the same secret", () => {
  const e = enrollTotp("ProvenPin Demo", "ada@example.test");
  const uri = new URL(e.uri);
  assert.equal(uri.protocol, "otpauth:");
  assert.equal(uri.searchParams.get("issuer"), "ProvenPin Demo");
  assert.equal(uri.searchParams.get("period"), "30");
  assert.equal(uri.searchParams.get("digits"), "6");
  assert.deepEqual(decodeBase32IgnorePadding(uri.searchParams.get("secret")!), e.key);
  assert.deepEqual(decodeBase32IgnorePadding(e.manualKey), e.key);
});

test("TOTP codes verify within the grace window only", (t) => {
  // RFC 6238 Appendix B SHA-1 test secret and vectors; RFC 4226 Appendix D: HOTP count 1 is 287082.
  const key = new TextEncoder().encode("12345678901234567890");
  t.mock.timers.enable({ apis: ["Date"], now: 1_111_111_109_000 });
  assert.equal(generateTotp(key, 30, 8), "07081804");
  t.mock.timers.setTime(1_234_567_890_000);
  assert.equal(generateTotp(key, 30, 8), "89005924");
  t.mock.timers.setTime(59_000);
  assert.equal(generateTotp(key, 30, 8), "94287082");
  assert.equal(generateHotp(key, 1n, 6), "287082");
  const code = generateTotp(key, 30, 6);
  assert.equal(verifyTotp(key, code), true);
  t.mock.timers.tick(30_000); // next window: previous code still accepted
  assert.equal(verifyTotp(key, code), true);
  t.mock.timers.tick(60_000); // two windows later: rejected
  assert.equal(verifyTotp(key, code), false);
  assert.equal(verifyTotp(key, "12345"), false);
});

test("recovery codes are single use and case-insensitive", () => {
  const r = makeRecoveryCodes(3);
  assert.equal(new Set(r.codes).size, 3);
  for (const c of r.codes) assert.match(c, /^[A-HJ-NP-Z2-9]{10}$/);
  assert.equal(r.use(r.codes[0].toLowerCase()), true);
  assert.equal(r.use(r.codes[0]), false);
  assert.equal(r.remaining(), 2);
  assert.equal(r.use("WRONGCODE1"), false);
});
