// Privacy-safe usage events. Records ONLY: MCP method, tool name, recipe id or search query LENGTH
// (never the query text), the MCP client's self-reported clientInfo name+version, an internal flag, the tier (free/pro,
// never the key), and a timestamp.
// No IPs, no user agents, no headers, no session ids, no query text.
export interface UsageEvent {
  ts: string; method: string; tool: string; recipe: string; qlen: number;
  client: string; client_version: string; internal: boolean; tier: "free" | "pro";
}
export interface AnalyticsSink { writeDataPoint(p: { blobs?: string[]; doubles?: number[]; indexes?: string[] }): void }

export const INTERNAL_CLIENT = "provenpin-internal";
const clean = (s: unknown, max = 64) => (typeof s === "string" ? s.replace(/[^\w.@\/+:-]/g, "").slice(0, max) : "");

// Stateless server: clientInfo arrives only on initialize, so we echo it back inside Mcp-Session-Id
// ("pp1.<b64url name>.<b64url version>.<random>"); clients resend it on later requests and we read only name+version.
const b64 = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s: string) => { try { return atob(s.replace(/-/g, "+").replace(/_/g, "/")); } catch { return ""; } };
export function makeSessionId(name: string, version: string) {
  const rnd = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");
  return `pp1.${b64(clean(name) || "unknown")}.${b64(clean(version, 32) || "unknown")}.${rnd}`;
}
export function clientFromSession(id: string | null): { name: string; version: string } | null {
  const p = (id ?? "").split(".");
  if (p.length !== 4 || p[0] !== "pp1") return null;
  return { name: clean(unb64(p[1])) || "unknown", version: clean(unb64(p[2]), 32) || "unknown" };
}

export function eventFor(msg: any, client: { name: string; version: string }, internalHeader: boolean, tier: "free" | "pro" = "free"): UsageEvent {
  const method = clean(msg?.method, 48) || "invalid";
  const tool = method === "tools/call" ? clean(msg?.params?.name, 48) : "";
  const args = msg?.params?.arguments ?? {};
  return {
    ts: new Date().toISOString(), method, tool,
    recipe: tool === "get_recipe" ? clean(args.id, 96) : "",
    qlen: tool === "search_recipes" && typeof args.query === "string" ? args.query.length : 0,
    client: client.name, client_version: client.version,
    internal: internalHeader || client.name === INTERNAL_CLIENT, tier,
  };
}

export function record(ev: UsageEvent, sink?: AnalyticsSink) {
  try {
    sink?.writeDataPoint({
      indexes: [ev.client.slice(0, 32)],
      blobs: [ev.method, ev.tool, ev.recipe, ev.client, ev.client_version, ev.internal ? "internal" : "external", ev.tier],
      doubles: [ev.qlen],
    });
  } catch {}
  console.log(JSON.stringify({ provenpin_usage: 1, ...ev }));
}
