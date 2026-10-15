import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import jwt from "jsonwebtoken";
import {
  AUDIENCE,
  ISSUER,
  signHs256,
  signRs256,
  verifyHs256,
  verifyRs256,
} from "../src/tokens.ts";

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

test("HS256: signs and verifies with expiresIn, issuer and audience", () => {
  const token = signHs256({ sub: "user-1" });
  const decoded = jwt.decode(token, { complete: true }) as {
    header: { alg: string };
    payload: { sub: string; iss: string; aud: string; iat: number; exp: number };
  };

  assert.equal(decoded.header.alg, "HS256");
  assert.equal(decoded.payload.iss, ISSUER);
  assert.equal(decoded.payload.aud, AUDIENCE);
  assert.equal(decoded.payload.exp - decoded.payload.iat, 3600);

  assert.equal(verifyHs256(token).sub, "user-1");
});

test("HS256: rejects a token issued for a different issuer", () => {
  const token = signHs256({ sub: "user-iss" });
  assert.throws(
    () => verifyHs256(token, { issuer: "https://evil.example" }),
    (err: unknown) => {
      assert.ok(err instanceof jwt.JsonWebTokenError);
      assert.match((err as Error).message, /issuer/);
      return true;
    },
  );
});

test("HS256: rejects a token presented to the wrong audience", () => {
  const token = signHs256({ sub: "user-aud" });
  assert.throws(
    () => verifyHs256(token, { audience: "someone-else" }),
    (err: unknown) => {
      assert.ok(err instanceof jwt.JsonWebTokenError);
      assert.match((err as Error).message, /audience/);
      return true;
    },
  );
});

test("HS256: detects TokenExpiredError deterministically via clockTimestamp", () => {
  const issuedAt = 1_700_000_000;
  const token = signHs256({ sub: "user-exp", iat: issuedAt }, 60);

  assert.equal(verifyHs256(token, { clockTimestamp: issuedAt }).sub, "user-exp");

  assert.throws(
    () => verifyHs256(token, { clockTimestamp: issuedAt + 61 }),
    (err: unknown) => {
      assert.ok(err instanceof jwt.TokenExpiredError);
      assert.equal(err.expiredAt.getTime(), (issuedAt + 60) * 1000);
      return true;
    },
  );
});

test("HS256: rejects the 'none' algorithm", () => {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = `${encode({ alg: "none", typ: "JWT" })}.${encode({
    sub: "attacker",
    iss: ISSUER,
    aud: AUDIENCE,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })}.`;

  assert.throws(
    () => verifyHs256(token),
    (err: unknown) => {
      assert.ok(err instanceof jwt.JsonWebTokenError);
      assert.ok(!(err instanceof jwt.TokenExpiredError));
      return true;
    },
  );
});

test("RS256: signs with the private key and verifies with the public key", () => {
  const token = signRs256({ sub: "user-rs" }, privateKey);
  const decoded = jwt.decode(token, { complete: true }) as { header: { alg: string } };

  assert.equal(decoded.header.alg, "RS256");
  assert.equal(verifyRs256(token, publicKey).sub, "user-rs");
});

test("RS256: rejects an HS256 token presented as RS256", () => {
  const hsToken = signHs256({ sub: "user-hs" });
  assert.throws(
    () => verifyRs256(hsToken, publicKey),
    (err: unknown) => {
      assert.ok(err instanceof jwt.JsonWebTokenError);
      return true;
    },
  );
});

test("RS256: rejects a token signed by an unrelated key", () => {
  const other = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  const token = signRs256({ sub: "user-other" }, other.privateKey);

  assert.throws(
    () => verifyRs256(token, publicKey),
    (err: unknown) => {
      assert.ok(err instanceof jwt.JsonWebTokenError);
      assert.match((err as Error).message, /invalid signature/);
      return true;
    },
  );
});
