import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const checkPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export async function createSession(userId: string, secret: Uint8Array, ttl = "2h") {
  return new SignJWT({ role: "user" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer("my-app")
    .setExpirationTime(ttl)
    .sign(secret);
}

export async function readSession(token: string, secret: Uint8Array) {
  const { payload } = await jwtVerify(token, secret, { issuer: "my-app", algorithms: ["HS256"] });
  return { userId: payload.sub!, role: payload.role as string };
}
