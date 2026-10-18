import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aesEncryptWithPassphrase,
  aesDecryptWithPassphrase,
  aesEncryptWithKeyIv,
  aesDecryptWithKeyIv,
  aesEncryptNoPadding,
  hmacSha256Hex,
  hmacSha256Base64,
  sha256Hex,
  pbkdf2Hex,
} from "../src/crypto.ts";

const KEY_HEX = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
const IV_HEX = "000102030405060708090a0b0c0d0e0f";
const WRONG_KEY_HEX = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

test("AES passphrase roundtrip", () => {
  const plaintext = "provenpin offline recipe";
  const passphrase = "correct horse battery staple";
  const ciphertext = aesEncryptWithPassphrase(plaintext, passphrase);
  assert.notEqual(ciphertext, plaintext);
  assert.equal(aesDecryptWithPassphrase(ciphertext, passphrase), plaintext);
});

test("AES passphrase output is randomized by an embedded salt", () => {
  const a = aesEncryptWithPassphrase("same input", "pw");
  const b = aesEncryptWithPassphrase("same input", "pw");
  assert.notEqual(a, b);
  assert.equal(aesDecryptWithPassphrase(a, "pw"), "same input");
  assert.equal(aesDecryptWithPassphrase(b, "pw"), "same input");
});

test("AES key/iv CBC Pkcs7 roundtrip", () => {
  const plaintext = "block cipher payload that spans more than one block";
  const ciphertext = aesEncryptWithKeyIv(plaintext, KEY_HEX, IV_HEX);
  assert.notEqual(ciphertext, plaintext);
  assert.equal(aesDecryptWithKeyIv(ciphertext, KEY_HEX, IV_HEX), plaintext);
});

test("AES key/iv decryption with a wrong key does not return the plaintext", () => {
  const ciphertext = aesEncryptWithKeyIv("secret", KEY_HEX, IV_HEX);
  let decrypted = "";
  try {
    decrypted = aesDecryptWithKeyIv(ciphertext, WRONG_KEY_HEX, IV_HEX);
  } catch {
    decrypted = "";
  }
  assert.notEqual(decrypted, "secret");
});

test("AES-128-CBC known vector (NIST SP 800-38A F.2.1, no padding)", () => {
  const ciphertext = aesEncryptNoPadding(
    "6bc1bee22e409f96e93d7e117393172a",
    "2b7e151628aed2a6abf7158809cf4f3c",
    "000102030405060708090a0b0c0d0e0f",
  );
  assert.equal(ciphertext, "7649abac8119b246cee98e9b12e9197d");
});

test("HmacSHA256 known vector (hex)", () => {
  const message = "The quick brown fox jumps over the lazy dog";
  const expected = "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8";
  assert.equal(hmacSha256Hex(message, "key"), expected);
});

test("HmacSHA256 base64 encodes the same known vector bytes", () => {
  const message = "The quick brown fox jumps over the lazy dog";
  const expected = "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8";
  const encoded = hmacSha256Base64(message, "key");
  assert.equal(Buffer.from(encoded, "base64").toString("hex"), expected);
});

test("SHA256 known vectors", () => {
  assert.equal(
    sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  assert.equal(
    sha256Hex(""),
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  );
});

test("PBKDF2-HMAC-SHA256 known vectors", () => {
  assert.equal(
    pbkdf2Hex("password", "salt", 1, 256),
    "120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b",
  );
  assert.equal(
    pbkdf2Hex("password", "salt", 2, 256),
    "ae4d0c95af6b46d32d0adff928f06dd02a303f8ef3c251dfd6e2d85a95474c43",
  );
});
