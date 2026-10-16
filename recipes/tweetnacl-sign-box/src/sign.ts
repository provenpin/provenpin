import nacl from "tweetnacl";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type SigningKeyPair = {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
};

export function createSigningKeyPair(): SigningKeyPair {
  return nacl.sign.keyPair();
}

export function sign(message: string, secretKey: Uint8Array): Uint8Array {
  return nacl.sign.detached(encoder.encode(message), secretKey);
}

export function verify(
  message: string,
  signature: Uint8Array,
  publicKey: Uint8Array,
): boolean {
  return nacl.sign.detached.verify(encoder.encode(message), signature, publicKey);
}

export function signAttached(message: string, secretKey: Uint8Array): Uint8Array {
  return nacl.sign(encoder.encode(message), secretKey);
}

export function openSigned(
  signed: Uint8Array,
  publicKey: Uint8Array,
): string | null {
  const message = nacl.sign.open(signed, publicKey);
  return message ? decoder.decode(message) : null;
}
