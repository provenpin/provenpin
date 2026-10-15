// Minimal stateless MCP server over Streamable HTTP (JSON responses), no SDK needed.
// Works anywhere with web-standard Request/Response: Cloudflare Workers, Node 20+, Bun, Deno.
import { listStacks, searchRecipes, type RecipeIndex } from "./search.ts";

export const PROTOCOL_VERSION = "2025-06-18";
const SUPPORTED = ["2025-06-18", "2025-03-26", "2024-11-05"];

export interface ServerOptions {
  /** Comma-separated valid keys. When set, a valid x-provenpin-key header marks the caller as Pro. */
  apiKeys?: string;
  /** When "true", requests without a valid key are rejected (future Pro-only mode). */
  requireKey?: string;
  version?: string;
}

const TOOLS = [
  {
    name: "search_recipes",
    title: "Search tested recipes",
    description: "Find a tested, version-pinned code recipe for wiring libraries together. Call this BEFORE writing glue code that combines 2+ libraries (auth + framework, ORM + database, payments webhooks, queues, validation, request mocking, logging), and when you hit version conflicts, peer-dependency errors, or integration errors between libraries. Example queries: 'express stripe webhook', 'fastapi sqlmodel crud', 'hono jwt'. Only recipes whose latest test run passed are returned. Each result lists its exact pinned versions and a test receipt (receipt.last_passed_at). If nothing matches, write the code yourself; try list_stacks to see what is covered.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What you are wiring together, in plain words or library names, e.g. 'django rest api' or 'rq redis jobs'." },
        stack: { type: "array", items: { type: "string" }, description: "Only recipes that use all of these libraries." },
        language: { type: "string", enum: ["typescript", "python"] },
        limit: { type: "integer", minimum: 1, maximum: 25, default: 10 },
      },
      required: ["query"],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: "get_recipe",
    title: "Get a recipe",
    description: "Get a full recipe by id (ids come from search_recipes): every source and test file, the exact pinned dependency versions, the setup and test commands, and its test receipt (when it last passed, test counts, runtime and runner). Use the pinned versions together; they are the versions the tests passed with. Adapt names and config to the user's project, and keep the included tests to check your integration.",
    inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
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
    const results = searchRecipes(index, args.query, { stack: args.stack, language: args.language, limit });
    return text({ count: results.length, results, hint: results.length ? "Call get_recipe with an id for the full files." : "No tested recipe matched. Try fewer words or call list_stacks." });
  }
  if (name === "get_recipe") {
    const r = index.recipes.find((x) => x.id === args.id);
    if (!r) return text(`No recipe with id '${args.id}'. Use search_recipes to find ids.`, true);
    if (r.receipt.status !== "passed") return text(`Recipe '${r.id}' is not currently passing (status: ${r.receipt.status}).`, true);
    return text(r);
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
  "access-control-allow-headers": "content-type, mcp-protocol-version, mcp-session-id, x-provenpin-key, authorization",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

export function createHandler(index: RecipeIndex, opts: ServerOptions = {}) {
  const keys = new Set((opts.apiKeys ?? "").split(",").map((k) => k.trim()).filter(Boolean));
  const version = opts.version ?? "0.1.0";
  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === "/" || url.pathname === "/health") {
      return Response.json({ name: "ProvenPin MCP", ok: true, recipes: index.recipes.filter((r) => r.receipt.status === "passed").length, index_generated_at: index.generated_at, mcp_endpoint: "/mcp" }, { headers: CORS });
    }
    if (url.pathname !== "/mcp") return new Response("Not found", { status: 404, headers: CORS });
    if (req.method === "GET") return new Response("Method Not Allowed", { status: 405, headers: { ...CORS, allow: "POST" } });
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: CORS });

    const key = req.headers.get("x-provenpin-key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const tier = key && keys.has(key) ? "pro" : "free";
    if (opts.requireKey === "true" && tier !== "pro") return Response.json(err(null, -32001, "A valid x-provenpin-key header is required"), { status: 401, headers: CORS });

    let body: any;
    try { body = await req.json(); } catch { return Response.json(err(null, -32700, "Parse error"), { status: 400, headers: CORS }); }
    const msgs = Array.isArray(body) ? body : [body];
    const out = msgs.map((m) => handleRpc(index, m, tier, version)).filter((x): x is Json => x !== null);
    if (out.length === 0) return new Response(null, { status: 202, headers: CORS });
    return Response.json(Array.isArray(body) ? out : out[0], { headers: { ...CORS, "x-provenpin-tier": tier } });
  };
}
