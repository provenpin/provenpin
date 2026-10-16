import { test } from "node:test";
import assert from "node:assert/strict";
import nacl from "tweetnacl";
import {
  createSigningKeyPair,
  sign,
  signAttached,
  verify,
  openSigned,
} from "../src/sign.ts";

test("detached signature verifies with the matching key", () => {
  const keys = createSigningKeyPair();
  const signature = sign("hello world", keys.secretKey);
  assert.equal(signature.length, nacl.sign.signatureLength);
  assert.equal(verify("hello world", signature, keys.publicKey), true);
});

test("tampered message fails verification", () => {
  const keys = createSigningKeyPair();
  const signature = sign("hello", keys.secretKey);
  assert.equal(verify("hello!", signature, keys.publicKey), false);
});

test("signature from another key fails verification", () => {
  const alice = createSigningKeyPair();
  const bob = createSigningKeyPair();
  const signature = sign("hello", alice.secretKey);
  assert.equal(verify("hello", signature, bob.publicKey), false);
});

test("attached signature round-trips", () => {
  const keys = createSigningKeyPair();
  const signed = signAttached("hi there", keys.secretKey);
  assert.equal(openSigned(signed, keys.publicKey), "hi there");
});
