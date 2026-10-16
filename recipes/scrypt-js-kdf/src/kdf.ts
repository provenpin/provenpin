import scryptJs from "scrypt-js";

const { scrypt, syncScrypt } = scryptJs;

export type ScryptOptions = {
  N?: number;
  r?: number;
  p?: number;
  dkLen?: number;
};

const DEFAULTS: Required<ScryptOptions> = { N: 1024, r: 8, p: 1, dkLen: 32 };

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function encode(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

export function deriveKeySync(password: string, salt: string, options: ScryptOptions = {}): string {
  const { N, r, p, dkLen } = { ...DEFAULTS, ...options };
  return toHex(syncScrypt(encode(password), encode(salt), N, r, p, dkLen));
}

export async function deriveKey(password: string, salt: string, options: ScryptOptions = {}): Promise<string> {
  const { N, r, p, dkLen } = { ...DEFAULTS, ...options };
  return toHex(await scrypt(encode(password), encode(salt), N, r, p, dkLen));
}
