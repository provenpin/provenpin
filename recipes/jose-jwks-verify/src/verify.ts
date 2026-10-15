import { jwtVerify, createLocalJWKSet, createRemoteJWKSet, type JSONWebKeySet, type JWTVerifyGetKey } from "jose";

// Production: createRemoteJWKSet(new URL("https://YOUR_ISSUER/.well-known/jwks.json")) caches and refetches on unknown kid.
export const remoteKeys = (jwksUrl: string) => createRemoteJWKSet(new URL(jwksUrl));
export const localKeys = (jwks: JSONWebKeySet) => createLocalJWKSet(jwks);

export async function verifyAccessToken(token: string, keys: JWTVerifyGetKey, issuer: string, audience: string) {
  const { payload } = await jwtVerify(token, keys, { issuer, audience, algorithms: ["RS256"], clockTolerance: 5 });
  return { sub: payload.sub!, scope: String(payload.scope ?? "").split(" ").filter(Boolean) };
}
