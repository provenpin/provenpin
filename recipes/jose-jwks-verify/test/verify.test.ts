import { describe, it, expect, beforeAll } from "vitest";
import { SignJWT, generateKeyPair, exportJWK, type CryptoKey } from "jose";
import { localKeys, verifyAccessToken } from "../src/verify";

const ISS = "https://auth.example.com/", AUD = "https://api.example.com";
let k1: { privateKey: CryptoKey; publicKey: CryptoKey }, k2: typeof k1, keys: ReturnType<typeof localKeys>;

beforeAll(async () => {
  k1 = await generateKeyPair("RS256"); k2 = await generateKeyPair("RS256");
  const jwk = async (k: CryptoKey, kid: string) => ({ ...(await exportJWK(k)), kid, alg: "RS256", use: "sig" });
  keys = localKeys({ keys: [await jwk(k1.publicKey, "old"), await jwk(k2.publicKey, "new")] }); // both published during rotation
});

const sign = (key: CryptoKey, kid: string, claims: Record<string, unknown> = {}, opts: { iss?: string; aud?: string; exp?: string } = {}) =>
  new SignJWT({ scope: "read:items write:items", ...claims }).setProtectedHeader({ alg: "RS256", kid })
    .setSubject("user_1").setIssuer(opts.iss ?? ISS).setAudience(opts.aud ?? AUD).setIssuedAt().setExpirationTime(opts.exp ?? "5m").sign(key);

describe("jwks verification", () => {
  it("accepts tokens from either published key", async () => {
    expect(await verifyAccessToken(await sign(k1.privateKey, "old"), keys, ISS, AUD)).toEqual({ sub: "user_1", scope: ["read:items", "write:items"] });
    expect((await verifyAccessToken(await sign(k2.privateKey, "new"), keys, ISS, AUD)).sub).toBe("user_1");
  });

  it("rejects wrong issuer, audience and expired tokens", async () => {
    await expect(verifyAccessToken(await sign(k1.privateKey, "old", {}, { iss: "https://evil/" }), keys, ISS, AUD)).rejects.toThrow();
    await expect(verifyAccessToken(await sign(k1.privateKey, "old", {}, { aud: "other" }), keys, ISS, AUD)).rejects.toThrow();
    await expect(verifyAccessToken(await sign(k1.privateKey, "old", {}, { exp: "-1m" }), keys, ISS, AUD)).rejects.toThrow(/exp/);
  });

  it("rejects a signature from the wrong key under a valid kid", async () => {
    await expect(verifyAccessToken(await sign(k2.privateKey, "old"), keys, ISS, AUD)).rejects.toThrow();
  });
});
