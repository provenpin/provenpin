import { test } from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "../src/mcp.ts";
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

const handler = createHandler(index, { apiKeys: "pro_key_1" });
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
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "ping" }, { "x-provenpin-key": "pro_key_1" })).res.headers.get("x-provenpin-tier"), "pro");
  assert.equal((await rpc({ jsonrpc: "2.0", id: 1, method: "ping" })).res.headers.get("x-provenpin-tier"), "free");
  const strict = createHandler(index, { apiKeys: "k", requireKey: "true" });
  const res = await strict(new Request("http://x/mcp", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }) }));
  assert.equal(res.status, 401);
});
test("health endpoint", async () => {
  const res = await handler(new Request("http://x/health"));
  assert.equal((await res.json() as any).recipes, 2);
});
