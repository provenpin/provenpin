// Minimal stateless MCP server over Streamable HTTP (JSON responses), no SDK needed.
// Works anywhere with web-standard Request/Response: Cloudflare Workers, Node 20+, Bun, Deno.
import { clientFromSession, eventFor, makeSessionId, record, type AnalyticsSink } from "./usage.ts";
import { checkCompatibility, compatBoost, parseVersionsInput } from "./versions.ts";
import { listStacks, searchRecipes, type RecipeIndex } from "./search.ts";

export const PROTOCOL_VERSION = "2025-06-18";
const SUPPORTED = ["2025-06-18", "2025-03-26", "2024-11-05"];

/** Looks up a Pro key by its SHA-256 hex hash (e.g. a Cloudflare KV namespace). Keys are never stored in plain text. */
export interface KeyStore { get(key: string): Promise<string | null> }

/** Same shape as the Cloudflare Workers Rate Limiting binding (env.X.limit({ key })). */
export interface RateLimiter { limit(o: { key: string }): Promise<{ success: boolean }> }

/** In-memory fixed-window limiter for local dev/tests. Per-isolate only; not used in production. */
export class MemoryRateLimiter implements RateLimiter {
  private hits = new Map<string, { start: number; n: number }>();
  constructor(private max: number, private windowMs = 60_000, private now = () => Date.now()) {}
  async limit({ key }: { key: string }) {
    const t = this.now(); let h = this.hits.get(key);
    if (!h || t - h.start >= this.windowMs) { h = { start: t, n: 0 }; this.hits.set(key, h); }
    h.n++;
    return { success: h.n <= this.max };
  }
}

export interface ServerOptions {
  /** Feature flag for Pro keys. Unless "true", every caller is free tier and keys are ignored. */
  proEnabled?: string;
  /** Comma-separated valid keys (a Worker secret). A valid Authorization: Bearer key marks the caller as Pro. */
  apiKeys?: string;
  /** Optional KV namespace with entries "key:<sha256 hex of key>". A missing entry or a value starting with "revoked" means not Pro. */
  keyStore?: KeyStore;
  /** When "true" (and Pro is enabled), requests without a valid key are rejected (future Pro-only mode). */
  requireKey?: string;
  /** Public receipts feed served at /receipts.json. */
  receipts?: unknown;
  version?: string;
  /** Optional rate limiters (Cloudflare Workers Rate Limiting binding shape). Absent = no limit. Free keyed by IP, Pro by key id. */
  freeLimiter?: RateLimiter;
  proLimiter?: RateLimiter;
  /** Optional Workers Analytics Engine dataset for privacy-safe usage counts. */
  analytics?: AnalyticsSink;
}

const TOOLS = [
  {
    name: "search_recipes",
    title: "Search tested recipes",
    description: "Find a tested, version-pinned code recipe for wiring libraries together. Call this BEFORE writing glue code that combines 2+ libraries (auth + framework, ORM + database, payments webhooks, queues, validation, request mocking, logging), and when you hit version conflicts, peer-dependency errors, or integration errors between libraries. Example queries: 'express stripe webhook', 'fastapi sqlmodel crud', 'hono jwt'. Only recipes whose latest test run passed are returned. Each result lists its exact pinned versions and a test receipt (receipt.last_passed_at). Pass the project's lockfile or a {package: version} map as versions: recipes that match the installed versions rank first and each result gets a compatibility summary. If nothing matches, write the code yourself; try list_stacks to see what is covered.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What you are wiring together, in plain words or library names, e.g. 'django rest api' or 'rq redis jobs'." },
        stack: { type: "array", items: { type: "string" }, description: "Only recipes that use all of these libraries." },
        language: { type: "string", enum: ["typescript", "python"] },
        limit: { type: "integer", minimum: 1, maximum: 25, default: 10 },
        versions: { type: ["object", "string"], additionalProperties: { type: "string" }, description: "Optional but recommended: the versions in the user's project, so results are checked against them. Either a map like {\"next\": \"15.2.0\", \"zod\": \"3.23.8\"} or the raw text of package.json, package-lock.json, pnpm-lock.yaml, yarn.lock, requirements.txt, poetry.lock or uv.lock (max 200KB). Used only for this call, never stored." },
      },
      required: ["query"],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "get_recipe",
    title: "Get a recipe",
    description: "Get a full recipe by id (ids come from search_recipes): every source and test file, the exact pinned dependency versions, the setup and test commands, and its test receipt (when it last passed, test counts, runtime and runner). Pass the project's lockfile or a {package: version} map as versions to get a compatibility section first, comparing each pinned package with the installed one (exact, compatible, mismatch, or not in your project) with plain warnings. Use the pinned versions together; they are the versions the tests passed with. Adapt names and config to the user's project, and keep the included tests to check your integration.",
    inputSchema: { type: "object", properties: { id: { type: "string" }, versions: { type: ["object", "string"], additionalProperties: { type: "string" }, description: "Optional but recommended: the versions in the user's project, so results are checked against them. Either a map like {\"next\": \"15.2.0\", \"zod\": \"3.23.8\"} or the raw text of package.json, package-lock.json, pnpm-lock.yaml, yarn.lock, requirements.txt, poetry.lock or uv.lock (max 200KB). Used only for this call, never stored." }, }, required: ["id"] },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "list_stacks",
    title: "List stacks",
    description: "List the libraries and frameworks that currently have passing, version-pinned recipes, with recipe counts. Call this to check whether ProvenPin covers a library before searching, or after a search returns nothing, and use the names as the stack filter in search_recipes.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
];

type Json = Record<string, any>;
const ok = (id: any, result: unknown) => ({ jsonrpc: "2.0", id, result });
const err = (id: any, code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });
const text = (data: unknown, isError = false) => ({ content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }], ...(isError ? { isError: true } : {}) });

export function callTool(index: RecipeIndex, name: string, args: Json, tier: "free" | "pro") {
  if (name === "search_recipes") {
    if (typeof args.query !== "string") return text("query must be a string", true);
    const limit = Math.min(Math.max(+args.limit || 10, 1), tier === "pro" ? 25 : 10);
    const pv = args.versions === undefined ? null : parseVersionsInput(args.versions);
    if (pv && "error" in pv) return text(pv.error, true);
    let results: any[] = searchRecipes(index, args.query, { stack: args.stack, language: args.language, limit: pv ? 50 : limit });
    if (pv) {
      results = results.map((r) => {
        const c = checkCompatibility(r.pinned, pv);
        return { ...r, score: r.score + compatBoost(c), compatibility: { overall: c.overall, summary: c.summary, mismatches: c.packages.filter((p) => p.verdict === "mismatch").map((p) => ({ package: p.package, tested: p.tested, yours: p.yours })) } };
      }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit);
    }
    return text({ count: results.length, ...(pv ? { versions_detected: { format: pv.format, packages: pv.versions.size } } : {}), results, hint: results.length ? "Call get_recipe with an id for the full files." : "No tested recipe matched. Try fewer words or call list_stacks." });
  }
  if (name === "get_recipe") {
    const r = index.recipes.find((x) => x.id === args.id);
    if (!r) return text(`No recipe with id '${args.id}'. Use search_recipes to find ids.`, true);
    if (r.receipt.status !== "passed") return text(`Recipe '${r.id}' is not currently passing (status: ${r.receipt.status}).`, true);
    if (args.versions === undefined) return text(r);
    const pv = parseVersionsInput(args.versions);
    if ("error" in pv) return text(pv.error, true);
    return text({ compatibility: checkCompatibility(r.pinned, pv), ...r });
  }
  if (name === "list_stacks") return text({ stacks: listStacks(index) });
  return null;
}

export function handleRpc(index: RecipeIndex, msg: Json, tier: "free" | "pro", version: string): Json | null {
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return err(msg?.id ?? null, -32600, "Invalid Request");
  const isNotification = msg.id === undefined;
  if (isNotification) return null;
  switch (msg.method) {
    case "initialize": {
      const asked = msg.params?.protocolVersion;
      return ok(msg.id, {
        protocolVersion: SUPPORTED.includes(asked) ? asked : PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "provenpin", title: "ProvenPin", version },
        instructions: "ProvenPin serves small, working code recipes that combine popular TypeScript and Python libraries. Each recipe pins every dependency to an exact version and comes with a test receipt from its latest run; only passing recipes are served. Call search_recipes before writing glue code that combines two or more libraries, and when debugging version conflicts or integration errors between libraries. Then call get_recipe for the files. If no recipe matches, continue normally.",
      });
    }
    case "ping": return ok(msg.id, {});
    case "tools/list": return ok(msg.id, { tools: TOOLS });
    case "tools/call": {
      const res = callTool(index, msg.params?.name, msg.params?.arguments ?? {}, tier);
      return res ? ok(msg.id, res) : err(msg.id, -32602, `Unknown tool: ${msg.params?.name}`);
    }
    default: return err(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, mcp-protocol-version, mcp-session-id, x-provenpin-key, x-provenpin-internal, authorization",
  "access-control-expose-headers": "mcp-session-id",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

export async function sha256Hex(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function createHandler(index: RecipeIndex, opts: ServerOptions = {}) {
  const keys = new Set((opts.apiKeys ?? "").split(",").map((k) => k.trim()).filter(Boolean));
  const proEnabled = opts.proEnabled === "true";
  async function tierFor(req: Request): Promise<{ tier: "free" | "pro"; keyId: string }> {
    const free = { tier: "free" as const, keyId: "" };
    if (!proEnabled) return free;
    const key = (req.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? req.headers.get("x-provenpin-key") ?? "").trim();
    if (!key || key.length > 200) return free;
    const hash = await sha256Hex(key);
    const pro = { tier: "pro" as const, keyId: hash.slice(0, 8) };
    if (keys.has(key)) return pro;
    if (opts.keyStore) { try { const v = await opts.keyStore.get(`key:${hash}`); if (v && !v.startsWith("revoked")) return pro; } catch {} }
    return free;
  }
  async function allowed(req: Request, tier: "free" | "pro", keyId: string) {
    const lim = tier === "pro" ? opts.proLimiter : opts.freeLimiter;
    if (!lim) return true;
    // IP is used only as the limiter key, in memory at the edge; it is never logged or stored by us.
    const k = tier === "pro" ? `pro:${keyId}` : `ip:${req.headers.get("cf-connecting-ip") ?? "unknown"}`;
    try { return (await lim.limit({ key: k })).success; } catch { return true; }
  }
  const version = opts.version ?? "0.1.0";
  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === "/" || url.pathname === "/health") {
      return Response.json({ name: "ProvenPin MCP", ok: true, recipes: index.recipes.filter((r) => r.receipt.status === "passed").length, index_generated_at: index.generated_at, mcp_endpoint: "/mcp" }, { headers: CORS });
    }
    if (url.pathname === "/receipts.json" && opts.receipts) {
      if (req.method !== "GET" && req.method !== "HEAD") return new Response("Method Not Allowed", { status: 405, headers: { ...CORS, allow: "GET" } });
      return new Response(req.method === "HEAD" ? null : JSON.stringify(opts.receipts), { headers: { ...CORS, "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300, s-maxage=3600" } });
    }
    if (url.pathname !== "/mcp") return new Response("Not found", { status: 404, headers: CORS });
    if (req.method === "GET") return new Response("Method Not Allowed", { status: 405, headers: { ...CORS, allow: "POST" } });
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: CORS });

    const { tier, keyId } = await tierFor(req);
    if (!(await allowed(req, tier, keyId))) return Response.json(err(null, -32029, "Rate limit exceeded, try again in a minute"), { status: 429, headers: { ...CORS, "retry-after": "60", "x-provenpin-tier": tier } });
    if (proEnabled && opts.requireKey === "true" && tier !== "pro") return Response.json(err(null, -32001, "A valid API key is required (Authorization: Bearer <key>)"), { status: 401, headers: CORS });

    let body: any;
    try { body = await req.json(); } catch { return Response.json(err(null, -32700, "Parse error"), { status: 400, headers: CORS }); }
    const msgs = Array.isArray(body) ? body : [body];
    const internalHeader = req.headers.get("x-provenpin-internal") === "1";
    const init = msgs.find((m) => m?.method === "initialize");
    const ci = init?.params?.clientInfo;
    const client = init ? { name: String(ci?.name ?? "unknown"), version: String(ci?.version ?? "unknown") }
      : clientFromSession(req.headers.get("mcp-session-id")) ?? { name: "unknown", version: "unknown" };
    for (const m of msgs) record(eventFor(m, client, internalHeader, tier, keyId), opts.analytics);
    const out = msgs.map((m) => handleRpc(index, m, tier, version)).filter((x): x is Json => x !== null);
    if (out.length === 0) return new Response(null, { status: 202, headers: CORS });
    const headers: Record<string, string> = { ...CORS, "x-provenpin-tier": tier };
    if (init) headers["mcp-session-id"] = makeSessionId(client.name, client.version);
    return Response.json(Array.isArray(body) ? out : out[0], { headers });
  };
}
