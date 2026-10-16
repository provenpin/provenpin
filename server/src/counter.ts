// Anonymous "real usage" counter. OFF unless PROVENPIN_USAGE_COUNTER = "true". See USAGE-COUNTER.md.
// Per real call it writes ONE aggregate-friendly data point: day, client name, client version, country, tool.
// No IPs, no raw user agents, no keys, no query text, no recipe ids, no session ids in the dataset.
// Engaged sessions (2+ real calls) use a short-lived KV entry keyed by a salted, truncated hash of the session id
// (TTL 2 days); when a session reaches its 2nd real call one "engaged_session" point (no id) is written.
import type { AnalyticsSink } from "./usage.ts";

export interface CounterKV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}
export interface CounterOptions { enabled?: string; sink?: AnalyticsSink; sessions?: CounterKV; salt?: string }

// Known scanners / generic HTTP tools / crawlers. Matched case-insensitively on the User-Agent; the UA itself is never stored.
export const SCANNER_UA = [
  /bot\b/i, /crawler/i, /spider/i, /scan/i, /^curl\//i, /^wget/i, /python-requests/i, /python-urllib/i, /aiohttp/i,
  /go-http-client/i, /okhttp/i, /java\//i, /libwww/i, /zgrab/i, /masscan/i, /nmap/i, /nuclei/i, /censys/i, /shodan/i,
  /httpx/i, /headless/i, /expanse/i, /palo alto/i, /internet-measurement/i,
];
// Missing UA is NOT treated as a scanner: some real MCP clients send none. Generic Node libs (undici, node-fetch, axios) are kept too.
export const isScanner = (ua: string | null) => !!ua && SCANNER_UA.some((r) => r.test(ua));

export const SESSION_TTL_SECONDS = 2 * 24 * 3600;

/** Lowercase, keep [a-z0-9._-], collapse spaces to "-", truncate. "Claude Code" -> "claude-code". */
export function normClient(s: unknown, max = 32) {
  if (typeof s !== "string") return "unknown";
  const v = s.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9._-]/g, "").slice(0, max);
  return v || "unknown";
}
/** Major.minor only, so versions stay coarse: "1.0.123" -> "1.0". */
export function normVersion(s: unknown) {
  if (typeof s !== "string") return "unknown";
  const m = s.trim().match(/^v?(\d{1,5})(?:\.(\d{1,5}))?/);
  return m ? (m[2] !== undefined ? `${m[1]}.${m[2]}` : m[1]) : "unknown";
}
export const normCountry = (c: unknown) => (typeof c === "string" && /^[A-Z0-9]{2}$/.test(c) ? c : "XX");

/** True when a tools/call result is a "real" call: get_recipe returned a recipe, or search_recipes had >= 1 result. */
export function isRealCall(msg: any, res: any): string | null {
  if (msg?.method !== "tools/call" || !res?.result || res.result.isError) return null;
  const tool = msg.params?.name;
  if (tool !== "get_recipe" && tool !== "search_recipes") return null;
  try {
    const body = JSON.parse(res.result.content?.[0]?.text ?? "null");
    if (tool === "get_recipe") return body && typeof body.id === "string" ? tool : null;
    return Array.isArray(body?.results) && body.results.length > 0 ? tool : null;
  } catch { return null; }
}

async function shortHash(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d).slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("");
}

export interface RealCall { tool: string; client: { name: string; version: string }; country: unknown; ua: string | null; sessionId: string | null; internal: boolean }

export function createCounter(o: CounterOptions) {
  const on = o.enabled === "true";
  return {
    enabled: on,
    async count(c: RealCall, now = new Date()) {
      if (!on || c.internal || isScanner(c.ua)) return;
      const day = now.toISOString().slice(0, 10);
      const client = normClient(c.client.name), ver = normVersion(c.client.version), country = normCountry(c.country);
      try { o.sink?.writeDataPoint({ indexes: [day], blobs: ["real_call", day, client, ver, country, c.tool], doubles: [1] }); } catch {}
      if (!o.sessions || !c.sessionId) return;
      try {
        // Salt includes the day, so hashes cannot be linked across days. Only the first 16 hex chars are kept.
        const key = `s:${day}:${await shortHash(`${o.salt ?? ""}|${day}|${c.sessionId}`)}`;
        const n = Number((await o.sessions.get(key)) ?? "0");
        if (n >= 2) return; // already counted; stop writing to save KV writes
        await o.sessions.put(key, String(n + 1), { expirationTtl: SESSION_TTL_SECONDS });
        if (n + 1 === 2) o.sink?.writeDataPoint({ indexes: [day], blobs: ["engaged_session", day, client, ver, country, ""], doubles: [1] });
      } catch {}
    },
  };
}
