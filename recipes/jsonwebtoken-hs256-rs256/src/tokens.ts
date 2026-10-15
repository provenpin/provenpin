import jwt from "jsonwebtoken";

export const HS_SECRET = "provenpin-hs256-secret";
export const ISSUER = "https://issuer.provenpin.dev";
export const AUDIENCE = "provenpin-api";

export type Payload = { sub: string } & Record<string, unknown>;

export type VerifyOptions = {
  issuer?: string;
  audience?: string;
  clockTimestamp?: number;
};

export function signHs256(payload: Payload, expiresIn: number | string = "1h"): string {
  return jwt.sign(payload, HS_SECRET, {
    algorithm: "HS256",
    expiresIn,
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

export function verifyHs256(token: string, options: VerifyOptions = {}): Payload {
  return jwt.verify(token, HS_SECRET, {
    algorithms: ["HS256"],
    issuer: options.issuer ?? ISSUER,
    audience: options.audience ?? AUDIENCE,
    clockTimestamp: options.clockTimestamp,
  }) as Payload;
}

export function signRs256(
  payload: Payload,
  privateKey: string,
  expiresIn: number | string = "1h",
): string {
  return jwt.sign(payload, privateKey, {
    algorithm: "RS256",
    expiresIn,
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

export function verifyRs256(
  token: string,
  publicKey: string,
  options: VerifyOptions = {},
): Payload {
  return jwt.verify(token, publicKey, {
    algorithms: ["RS256"],
    issuer: options.issuer ?? ISSUER,
    audience: options.audience ?? AUDIENCE,
    clockTimestamp: options.clockTimestamp,
  }) as Payload;
}
