import { sha256 } from "@noble/hashes/sha2.js";
import { blake3 } from "@noble/hashes/blake3.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

export function sha256Hex(input: string) {
  return bytesToHex(sha256(utf8ToBytes(input)));
}

export function blake3Hex(input: string) {
  return bytesToHex(blake3(utf8ToBytes(input)));
}
