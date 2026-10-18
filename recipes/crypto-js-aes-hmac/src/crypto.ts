import CryptoJS from "crypto-js";

export function aesEncryptWithPassphrase(plaintext: string, passphrase: string): string {
  return CryptoJS.AES.encrypt(plaintext, passphrase).toString();
}

export function aesDecryptWithPassphrase(ciphertext: string, passphrase: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function aesEncryptWithKeyIv(plaintext: string, keyHex: string, ivHex: string): string {
  const key = CryptoJS.enc.Hex.parse(keyHex);
  const iv = CryptoJS.enc.Hex.parse(ivHex);
  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
}

export function aesDecryptWithKeyIv(ciphertextB64: string, keyHex: string, ivHex: string): string {
  const key = CryptoJS.enc.Hex.parse(keyHex);
  const iv = CryptoJS.enc.Hex.parse(ivHex);
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Base64.parse(ciphertextB64),
  });
  const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}

export function aesEncryptNoPadding(plaintextHex: string, keyHex: string, ivHex: string): string {
  const key = CryptoJS.enc.Hex.parse(keyHex);
  const iv = CryptoJS.enc.Hex.parse(ivHex);
  const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Hex.parse(plaintextHex), key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.NoPadding,
  });
  return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
}

export function hmacSha256Hex(message: string, secret: string): string {
  return CryptoJS.HmacSHA256(message, secret).toString(CryptoJS.enc.Hex);
}

export function hmacSha256Base64(message: string, secret: string): string {
  return CryptoJS.HmacSHA256(message, secret).toString(CryptoJS.enc.Base64);
}

export function sha256Hex(message: string): string {
  return CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex);
}

export function pbkdf2Hex(
  password: string,
  salt: string,
  iterations: number,
  keySizeBits: number,
): string {
  const derived = CryptoJS.PBKDF2(password, salt, {
    keySize: keySizeBits / 32,
    iterations,
    hasher: CryptoJS.algo.SHA256,
  });
  return derived.toString(CryptoJS.enc.Hex);
}
