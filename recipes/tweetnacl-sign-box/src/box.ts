import nacl from "tweetnacl";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type BoxKeyPair = {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
};

export function createBoxKeyPair(): BoxKeyPair {
  return nacl.box.keyPair();
}

export function randomNonce(): Uint8Array {
  return nacl.randomBytes(nacl.box.nonceLength);
}

export function encrypt(
  message: string,
  nonce: Uint8Array,
  theirPublicKey: Uint8Array,
  mySecretKey: Uint8Array,
): Uint8Array {
  return nacl.box(encoder.encode(message), nonce, theirPublicKey, mySecretKey);
}

export function decrypt(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  theirPublicKey: Uint8Array,
  mySecretKey: Uint8Array,
): string | null {
  const message = nacl.box.open(
    ciphertext,
    nonce,
    theirPublicKey,
    mySecretKey,
  );
  return message ? decoder.decode(message) : null;
}
