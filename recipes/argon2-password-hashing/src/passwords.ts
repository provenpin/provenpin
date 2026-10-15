import argon2 from "argon2";

export const opts: argon2.Options = {
  type: argon2.argon2id,
  timeCost: 2,
  memoryCost: 19456,
  parallelism: 1,
};

export async function hashPassword(plain: string) {
  return argon2.hash(plain, opts);
}

export async function verifyPassword(hash: string, plain: string) {
  return argon2.verify(hash, plain);
}

export function needsRehash(hash: string) {
  return argon2.needsRehash(hash, opts);
}
