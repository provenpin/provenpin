import { test, before } from "node:test";
import assert from "node:assert/strict";
import type { PrivateKey } from "openpgp";
import {
  generateKeyPair,
  unlockPrivateKey,
  encryptAndSign,
  decryptAndVerify,
  signDetached,
  verifyDetached,
  type KeyPair,
} from "../src/pgp.ts";

const PASSPHRASE = "correct horse battery staple";

let alice: KeyPair;
let alicePrivate: PrivateKey;
let bob: KeyPair;

before(async () => {
  alice = await generateKeyPair(PASSPHRASE, "Alice", "alice@example.com");
  alicePrivate = await unlockPrivateKey(alice.privateKey, PASSPHRASE);
  bob = await generateKeyPair(PASSPHRASE, "Bob", "bob@example.com");
});

test("encrypts, signs, decrypts and verifies a message", async () => {
  const plaintext = "attack at dawn";
  const ciphertext = await encryptAndSign(plaintext, alice.publicKey, alicePrivate);
  const result = await decryptAndVerify(ciphertext, alicePrivate, alice.publicKey);
  assert.equal(result.text, plaintext);
  assert.equal(result.verified, true);
});

test("detached signature verifies against the original message", async () => {
  const plaintext = "detached payload";
  const signature = await signDetached(plaintext, alicePrivate);
  assert.equal(await verifyDetached(plaintext, signature, alice.publicKey), true);
});

test("detached signature does not verify with the wrong key", async () => {
  const plaintext = "detached payload";
  const signature = await signDetached(plaintext, alicePrivate);
  let verified = false;
  try {
    verified = await verifyDetached(plaintext, signature, bob.publicKey);
  } catch {
    verified = false;
  }
  assert.equal(verified, false);
});

test("wrong private key cannot decrypt", async () => {
  const ciphertext = await encryptAndSign("secret payload", alice.publicKey, alicePrivate);
  const bobPrivate = await unlockPrivateKey(bob.privateKey, PASSPHRASE);
  await assert.rejects(() => decryptAndVerify(ciphertext, bobPrivate, alice.publicKey));
});
