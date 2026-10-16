import { test } from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "../src/mcp.ts";
import { createCounter, isScanner, normClient, normVersion, normCountry, SESSION_TTL_SECONDS, type CounterKV } from "../src/counter.ts";
import type { RecipeIndex, Recipe } from "../src/search.ts";

const mk = (id: string, stack: string[]): Recipe => ({
  id, title: id, summary: id, language: "typescript", runtime: "node", stack, tags: [], pinned: { a: "1.0.0" }, setup: "", test: "",
  files: [], receipt: { status: "passed", ran_at: "2026-10-15T00:00:00Z", last_passed_at: "2026-10-15T00:00:00Z" },
});
const index: RecipeIndex = { schema_version: 1, generated_at: "x", count: 1, recipes: [mk("express-zod-validation", ["express", "zod"])] };
class Sink { points: any[] = []; writeDataPoint(p: any) { this.points.push(p); } }
class KV implements CounterKV {
  m = new Map<string, { v: string; ttl?: number }>();
  async get(k: string) { return this.m.get(k)?.v ?? null; }
  async put(k: string, v: string, o?: { expirationTtl?: number }) { this.m.set(k, { v, ttl: o?.expirationTtl }); }
}
function setup(enabled?: string) {
  const sink = new Sink(), kv = new KV();
  const h = createHandler(index, { usageCounter: enabled, counterSink: sink, counterSessions: kv, counterSalt: "salt" });
  const rpc = (body: any, headers: Record<string, string> = {}) => h(new Request("http://x/mcp", { method: "POST", headers: { "content-type": "application/json", "user-agent": "claude-code/1.0", ...headers }, body: JSON.stringify(body) }));
  return { sink, kv, rpc };
}
const tc = (name: string, args: object) => ({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } });

test("off by default: nothing written", async () => {
  for (const flag of [undefined, "false"]) {
    const { sink, kv, rpc } = setup(flag);
    await rpc(tc("get_recipe", { id: "express-zod-validation" }), { "mcp-session-id": "s1" });
    assert.equal(sink.points.length, 0); assert.equal(kv.m.size, 0);
  }
});

test("counts only real calls with client, version, country; no ids or query text", async () => {
  const { sink, rpc } = setup("true");
  const init = await rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", clientInfo: { name: "Claude-Code", version: "1.0.123" } } });
  const sid = init.headers.get("mcp-session-id")!;
  await rpc(tc("search_recipes", { query: "express zod" }), { "mcp-session-id": sid });
  await rpc(tc("search_recipes", { query: "kubernetes" }), { "mcp-session-id": sid }); // 0 results
  await rpc(tc("get_recipe", { id: "nope" }), { "mcp-session-id": sid }); // error
  await rpc(tc("list_stacks", {}), { "mcp-session-id": sid });
  const real = sink.points.filter((p) => p.blobs[0] === "real_call");
  assert.equal(real.length, 1);
  const [, day, client, ver, country, tool] = real[0].blobs;
  assert.match(day, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual([client, ver, country, tool], ["claude-code", "1.0", "XX", "search_recipes"]);
  assert.ok(!JSON.stringify(sink.points).includes("express zod"));
  assert.ok(!JSON.stringify(sink.points).includes(sid));
});

test("engaged session written once at the 2nd real call; KV key is hashed with TTL", async () => {
  const { sink, kv, rpc } = setup("true");
  for (let i = 0; i < 4; i++) await rpc(tc("get_recipe", { id: "express-zod-validation", ...(i === 3 ? { versions: { zod: "3.0.0" } } : {}) }), { "mcp-session-id": "raw-session-123" });
  assert.equal(sink.points.filter((p) => p.blobs[0] === "real_call").length, 4);
  assert.equal(sink.points.filter((p) => p.blobs[0] === "engaged_session").length, 1);
  assert.equal(kv.m.size, 1);
  const [k, v] = [...kv.m][0];
  assert.match(k, /^s:\d{4}-\d{2}-\d{2}:[0-9a-f]{16}$/);
  assert.ok(!k.includes("raw-session"));
  assert.equal(v.ttl, SESSION_TTL_SECONDS);
});

test("scanners and internal calls are dropped", async () => {
  const { sink, rpc } = setup("true");
  for (const ua of ["curl/8.4", "python-requests/2.31", "Mozilla/5.0 (compatible; Googlebot/2.1)", "zgrab/0.x", "Expanse, a Palo Alto Networks company"])
    await rpc(tc("get_recipe", { id: "express-zod-validation" }), { "user-agent": ua });
  await rpc(tc("get_recipe", { id: "express-zod-validation" }), { "x-provenpin-internal": "1" });
  assert.equal(sink.points.length, 0);
});

test("normalizers", () => {
  assert.equal(normClient("Cursor Vscode!"), "cursor-vscode");
  assert.equal(normClient("x".repeat(80)).length, 32);
  assert.equal(normClient(undefined), "unknown");
  assert.equal(normVersion("v2.5.1-beta"), "2.5");
  assert.equal(normVersion("garbage"), "unknown");
  assert.equal(normCountry("US"), "US"); assert.equal(normCountry("usa"), "XX");
  assert.equal(isScanner(null), false); assert.equal(isScanner("claude-code/1.0"), false); assert.equal(isScanner("Nuclei - Open-source"), true);
});

test("country from request.cf", async () => {
  const sink = new Sink();
  const c = createCounter({ enabled: "true", sink });
  await c.count({ tool: "get_recipe", client: { name: "cursor", version: "0.42.3" }, country: "DE", ua: "cursor/0.42", sessionId: null, internal: false });
  assert.deepEqual(sink.points[0].blobs.slice(2), ["cursor", "0.42", "DE", "get_recipe"]);
});
