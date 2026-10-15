import { test } from "node:test";
import assert from "node:assert/strict";
import { createHandler, sha256Hex } from "../src/mcp.ts";
import { searchRecipes, listStacks, type RecipeIndex, type Recipe } from "../src/search.ts";

const mk = (id: string, stack: string[], status = "passed", tags: string[] = []): Recipe => ({
  id, title: id.replace(/-/g, " "), summary: `recipe ${id}`, language: "typescript", runtime: "node", stack, tags,
  pinned: { a: "1.0.0" }, setup: "npm i", test: "npm test", files: [{ path: "a.ts", content: "x" }],
  receipt: { status, ran_at: "2026-10-15T00:00:00Z", last_passed_at: status === "passed" ? "2026-10-15T00:00:00Z" : null },
});
const index: RecipeIndex = { schema_version: 1, generated_at: "2026-10-15T00:00:00Z", count: 3, recipes: [
  mk("nextjs-stripe-webhook", ["nextjs", "stripe"], "passed", ["payments", "webhooks"]),
  mk("express-zod-validation", ["express", "zod"], "passed", ["validation"]),
  mk("broken-thing", ["stripe"], "failed"),
] };

const handler = createHandler(index, { apiKeys: "pro_key_1", proEnabled: "true", receipts: { count: 1, recipes: [{ id: "x" }] } });
async function rpc(body: unknown, headers: Record<string, string> = {}) {
  const res = await handler(new Request("http://x/mcp", { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) }));
  return { res, json: res.status === 202 ? null : await res.json() as any };
}
const call = async (name: string, args: object = {}) => JSON.parse((await rpc({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } })).json.result.content[0].text);

test("search ranks by stack, normalizes aliases, hides failing recipes", () => {
  const r = searchRecipes(index, "Next.js stripe");
  assert.equal(r[0].id, "nextjs-stripe-webhook");
  assert.ok(!r.some((x) => x.id === "broken-thing"));
  assert.equal(searchRecipes(index, "", { stack: ["zod"] })[0].id, "express-zod-validation");
  assert.equal(searchRecipes(index, "kubernetes").length, 0);
});
test("list_stacks counts only passing recipes", () => {
  assert.deepEqual(listStacks(index).find((s) => s.name === "stripe"), { name: "stripe", recipes: 1 });
});
test("initialize + tools/list", async () => {
  const init = await rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } } });
  assert.equal(init.json.result.serverInfo.name, "provenpin");
  assert.equal(init.json.result.protocolVersion, "2025-06-18");
  const notif = await rpc({ jsonrpc: "2.0", method: "notifications/initialized" });
  assert.equal(notif.res.status, 202);
  const list = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  assert.deepEqual(list.json.result.tools.map((t: any) => t.name), ["search_recipes", "get_recipe", "list_stacks"]);
});
test("tools/call works for all three tools", async () => {
  assert.equal((await call("search_recipes", { query: "stripe webhook" })).results[0].id, "nextjs-stripe-webhook");
  assert.equal((await call("get_recipe", { id: "express-zod-validation" })).files[0].path, "a.ts");
  assert.ok((await call("list_stacks")).stacks.length >= 4);
});
test("get_recipe errors for unknown or failing recipes", async () => {
  const r = await rpc({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "get_recipe", arguments: { id: "broken-thing" } } });
  assert.equal(r.json.result.isError, true);
});
test("protocol errors", async () => {
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "nope" })).json.error.code, -32601);
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "x" } })).json.error.code, -32602);
  const bad = await handler(new Request("http://x/mcp", { method: "POST", body: "{" }));
  assert.equal(bad.status, 400);
});
test("api key header sets tier; require mode rejects missing key", async () => {
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "ping" }, { authorization: "Bearer pro_key_1" })).res.headers.get("x-provenpin-tier"), "pro");
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "ping" }, { authorization: "Bearer wrong" })).res.headers.get("x-provenpin-tier"), "free");
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "ping" })).res.headers.get("x-provenpin-tier"), "free");
  const strict = createHandler(index, { apiKeys: "k", requireKey: "true", proEnabled: "true" });
  const res = await strict(new Request("http://x/mcp", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }) }));
  assert.equal(res.status, 401);
});
test("health endpoint", async () => {
  const res = await handler(new Request("http://x/health"));
  assert.equal((await res.json() as any).recipes, 2);
});

test("usage events are privacy-safe and carry clientInfo via session id", async () => {
  const points: any[] = [];
  const h = createHandler(index, { analytics: { writeDataPoint: (p) => points.push(p) } });
  const post = (body: unknown, headers: Record<string, string> = {}) =>
    h(new Request("http://x/mcp", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4", ...headers }, body: JSON.stringify(body) }));
  const init = await post({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "cursor", version: "1.7" } } });
  const sid = init.headers.get("mcp-session-id")!;
  assert.ok(sid.startsWith("pp1."));
  await post({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "search_recipes", arguments: { query: "secret words here" } } }, { "mcp-session-id": sid });
  await post({ jsonrpc: "2.0", id: 3, method: "tools/list" }, { "x-provenpin-internal": "1" });
  assert.equal(points.length, 3);
  assert.deepEqual(points[1].blobs, ["tools/call", "search_recipes", "", "cursor", "1.7", "external", "free"]);
  assert.deepEqual(points[1].doubles, [17]);
  assert.equal(points[2].blobs[5], "internal");
  const all = JSON.stringify(points);
  assert.ok(!all.includes("secret") && !all.includes("1.2.3.4"));
});

test("pro is off by default: keys ignored, require mode inert", async () => {
  const h = createHandler(index, { apiKeys: "k", requireKey: "true" });
  const res = await h(new Request("http://x/mcp", { method: "POST", headers: { authorization: "Bearer k" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }) }));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("x-provenpin-tier"), "free");
});
test("KV key store matches hashed keys; tier is logged, key is not", async () => {
  const hash = await sha256Hex("kv_secret_key");
  const points: any[] = [];
  const h = createHandler(index, { proEnabled: "true", keyStore: { get: async (k) => (k === `key:${hash}` ? "jp-test" : null) }, analytics: { writeDataPoint: (p) => points.push(p) } });
  const res = await h(new Request("http://x/mcp", { method: "POST", headers: { authorization: "Bearer kv_secret_key" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }) }));
  assert.equal(res.headers.get("x-provenpin-tier"), "pro");
  assert.equal(points[0].blobs[6], "pro");
  assert.ok(!JSON.stringify(points).includes("kv_secret_key"));
});
test("receipts.json is served and cacheable", async () => {
  const res = await handler(new Request("http://x/receipts.json"));
  assert.equal(res.status, 200);
  assert.match(res.headers.get("cache-control") ?? "", /public/);
  assert.equal((await res.json() as any).count, 1);
});
