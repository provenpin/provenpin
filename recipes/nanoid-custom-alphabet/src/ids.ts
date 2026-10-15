import { nanoid, customAlphabet } from "nanoid";
import { nanoid as nonSecure } from "nanoid/non-secure";

export const orderId = customAlphabet("0123456789ABCDEFGHJKLMNPQRSTUVWXYZ", 10);
export const shortCode = customAlphabet("abcdefghijkmnopqrstuvwxyz", 6);

export function newSessionId() {
  return nanoid(21);
}

export function newTempId() {
  return nonSecure(12);
}

export function assertAlphabet(id: string, alphabet: string) {
  for (const ch of id) if (!alphabet.includes(ch)) throw new Error(`bad char ${ch}`);
}
