import { generateSecret, generateSync, verifySync, generateURI } from "otplib";

export function newSecret() {
  return generateSecret();
}

export function totpNow(secret: string) {
  return generateSync({ secret, strategy: "totp" });
}

export function verifyTotp(secret: string, token: string) {
  return verifySync({ secret, token, strategy: "totp" });
}

export function hotpAt(secret: string, counter: number) {
  return generateSync({ secret, strategy: "hotp", counter });
}

export function verifyHotp(secret: string, token: string, counter: number) {
  return verifySync({ secret, token, strategy: "hotp", counter });
}

export function authUri(secret: string) {
  return generateURI({
    issuer: "ProvenPin",
    label: "demo@example.com",
    secret,
  });
}
