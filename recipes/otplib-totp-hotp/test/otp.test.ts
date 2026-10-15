import { test } from "node:test";
import assert from "node:assert/strict";
import { authUri, hotpAt, newSecret, totpNow, verifyHotp, verifyTotp } from "../src/otp.ts";

test("totp generate and verify", () => {
  const secret = newSecret();
  const token = totpNow(secret);
  assert.match(token, /^\d{6}$/);
  const result = verifyTotp(secret, token);
  assert.equal(result.valid, true);
});

test("hotp generate and verify at counter", () => {
  const secret = newSecret();
  const token = hotpAt(secret, 3);
  assert.equal(verifyHotp(secret, token, 3).valid, true);
  assert.equal(verifyHotp(secret, token, 4).valid, false);
});

test("otpauth uri includes issuer", () => {
  const uri = authUri(newSecret());
  assert.match(uri, /^otpauth:\/\/totp\//);
  assert.match(uri, /issuer=ProvenPin/);
});
