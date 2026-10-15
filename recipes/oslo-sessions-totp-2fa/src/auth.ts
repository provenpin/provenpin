import { sha256 } from "@oslojs/crypto/sha2";
import { constantTimeEqual } from "@oslojs/crypto/subtle";
import { generateRandomString, type RandomReader } from "@oslojs/crypto/random";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase, encodeBase32UpperCaseNoPadding } from "@oslojs/encoding";
import { createTOTPKeyURI, verifyTOTPWithGracePeriod } from "@oslojs/otp";

const DAY = 24 * 60 * 60 * 1000;
const SESSION_TTL = 30 * DAY;

export type Session = { id: string; userId: string; expiresAt: Date; twoFactorVerified: boolean };

const random: RandomReader = { read: (bytes) => crypto.getRandomValues(bytes) };

/**
 * Sessions in the style of the Lucia guide: the client holds a random token, the server stores
 * only sha256(token), so a leaked session table cannot be replayed.
 */
export function createSessionStore() {
  const sessions = new Map<string, Session>();
  const hashToken = (token: string) => encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

  return {
    sessions,
    generateToken() {
      const bytes = new Uint8Array(20);
      crypto.getRandomValues(bytes);
      return encodeBase32LowerCaseNoPadding(bytes); // 160 bits of entropy
    },
    create(token: string, userId: string): Session {
      const s = { id: hashToken(token), userId, expiresAt: new Date(Date.now() + SESSION_TTL), twoFactorVerified: false };
      sessions.set(s.id, s);
      return s;
    },
    /** Validates a token; slides expiry when less than 15 days remain; deletes expired sessions. */
    validate(token: string): Session | null {
      const s = sessions.get(hashToken(token));
      if (!s) return null;
      if (Date.now() >= s.expiresAt.getTime()) { sessions.delete(s.id); return null; }
      if (Date.now() >= s.expiresAt.getTime() - SESSION_TTL / 2) s.expiresAt = new Date(Date.now() + SESSION_TTL);
      return s;
    },
    invalidate(token: string) { sessions.delete(hashToken(token)); },
    invalidateAllForUser(userId: string) { for (const [id, s] of sessions) if (s.userId === userId) sessions.delete(id); },
  };
}

/** TOTP enrolment: a 20-byte secret, an otpauth:// URI for the QR code, and a manual entry key. */
export function enrollTotp(issuer: string, account: string, key = crypto.getRandomValues(new Uint8Array(20))) {
  return { key, uri: createTOTPKeyURI(issuer, account, key, 30, 6), manualKey: encodeBase32UpperCaseNoPadding(key) };
}

/** Accepts the current code or one from the previous/next 30s window to allow for clock drift. */
export function verifyTotp(key: Uint8Array, code: string) {
  return /^\d{6}$/.test(code) && verifyTOTPWithGracePeriod(key, 30, 6, code, 30);
}

/** Single-use recovery codes, stored hashed and compared in constant time. */
export function makeRecoveryCodes(n = 8) {
  const codes = Array.from({ length: n }, () => generateRandomString(random, "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10));
  const hashes = codes.map((c) => sha256(new TextEncoder().encode(c)));
  return {
    codes,
    use(code: string) {
      const h = sha256(new TextEncoder().encode(code.toUpperCase()));
      const i = hashes.findIndex((x) => constantTimeEqual(x, h));
      if (i === -1) return false;
      hashes.splice(i, 1);
      return true;
    },
    remaining: () => hashes.length,
  };
}
