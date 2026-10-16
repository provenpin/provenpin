import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createBoxKeyPair,
  decrypt,
  encrypt,
  randomNonce,
} from "../src/box.ts";

test("encrypts and decrypts between two key pairs", () => {
  const alice = createBoxKeyPair();
  const bob = createBoxKeyPair();
  const nonce = randomNonce();
  const ciphertext = encrypt("secret", nonce, bob.publicKey, alice.secretKey);
  assert.notEqual(new TextDecoder().decode(ciphertext), "secret");
  assert.equal(
    decrypt(ciphertext, nonce, alice.publicKey, bob.secretKey),
    "secret",
  );
});

test("decryption fails with the wrong key", () => {
  const alice = createBoxKeyPair();
  const bob = createBoxKeyPair();
  const eve = createBoxKeyPair();
  const nonce = randomNonce();
  const ciphertext = encrypt("secret", nonce, bob.publicKey, alice.secretKey);
  assert.equal(
    decrypt(ciphertext, nonce, eve.publicKey, eve.secretKey),
    null,
  );
});

test("rejects modified ciphertext", () => {
  const alice = createBoxKeyPair();
  const bob = createBoxKeyPair();
  const nonce = randomNonce();
  const ciphertext = encrypt("secret", nonce, bob.publicKey, alice.secretKey);
  const tampered = Uint8Array.from(ciphertext);
  tampered[0] ^= 0x01;
  assert.equal(
    decrypt(tampered, nonce, alice.publicKey, bob.secretKey),
    null,
  );
});
