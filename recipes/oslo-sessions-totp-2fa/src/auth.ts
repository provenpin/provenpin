import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { encodeBase32LowerCaseNoPadding, encodeBase32NoPadding, encodeHexLowerCase, encodeBase32UpperCaseNoPadding } from "@oslojs/encoding";

const DAY = 24 * 60 * 60 * 1000;
const SESSION_TTL = 30 * DAY;

export type Session = { id: string; userId: string; expiresAt: Date; twoFactorVerified: boolean };

const sha256 = (data: string) => createHash("sha256").update(data).digest();

/**
 * Sessions in the style of the Lucia guide: the client holds a random token, the server stores
 * only sha256(token), so a leaked session table cannot be replayed.
 */
export function createSessionStore() {
  const sessions = new Map<string, Session>();
  const hashToken = (token: string) => encodeHexLowerCase(sha256(token));

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

/** HOTP (RFC 4226): HMAC-SHA1 over the 8-byte big-endian counter, dynamic truncation, last `digits` digits. */
export function generateHotp(key: Uint8Array, counter: bigint, digits: number) {
  if (digits < 6 || digits > 8) throw new TypeError("Digits must be between 6 and 8");
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(counter);
  const hs = createHmac("sha1", key).update(msg).digest();
  const offset = hs[hs.length - 1] & 0x0f;
  const n = hs.readUInt32BE(offset) & 0x7fffffff;
  return (n % 10 ** digits).toString().padStart(digits, "0");
}

/** TOTP (RFC 6238): HOTP with counter = floor(now / period). */
export function generateTotp(key: Uint8Array, periodSeconds: number, digits: number) {
  return generateHotp(key, BigInt(Math.floor(Date.now() / (periodSeconds * 1000))), digits);
}

/** TOTP enrolment: a 20-byte secret, an otpauth:// URI for the QR code, and a manual entry key. */
export function enrollTotp(issuer: string, account: string, key = crypto.getRandomValues(new Uint8Array(20))) {
  const params = new URLSearchParams({ issuer, algorithm: "SHA1", secret: encodeBase32NoPadding(key), period: "30", digits: "6" });
  const uri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?${params}`;
  return { key, uri, manualKey: encodeBase32UpperCaseNoPadding(key) };
}

/** Accepts the current code or one from the previous/next 30s window to allow for clock drift. */
export function verifyTotp(key: Uint8Array, code: string) {
  if (!/^\d{6}$/.test(code)) return false;
  const now = Date.now(), grace = 30_000, period = 30_000;
  let ok = false;
  for (let c = BigInt(Math.floor((now - grace) / period)); c <= BigInt(Math.floor((now + grace) / period)); c++) {
    ok = timingSafeEqual(Buffer.from(generateHotp(key, c, 6)), Buffer.from(code)) || ok;
  }
  return ok;
}

/** Single-use recovery codes, stored hashed and compared in constant time. */
export function makeRecoveryCodes(n = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const codes = Array.from({ length: n }, () => Array.from({ length: 10 }, () => alphabet[randomInt(alphabet.length)]).join(""));
  const hashes = codes.map((c) => sha256(c));
  return {
    codes,
    use(code: string) {
      const h = sha256(code.toUpperCase());
      const i = hashes.findIndex((x) => timingSafeEqual(x, h));
      if (i === -1) return false;
      hashes.splice(i, 1);
      return true;
    },
    remaining: () => hashes.length,
  };
}
