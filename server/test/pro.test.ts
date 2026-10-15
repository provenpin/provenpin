import { test } from "node:test";
import assert from "node:assert/strict";
import { createHandler, sha256Hex, callTool } from "../src/mcp.ts";
import type { RecipeIndex } from "../src/search.ts";

const index: RecipeIndex = { schema_version: 1, generated_at: "2026-10-15T00:00:00Z", count: 0, recipes: [] };
const ping = (h: (r: Request) => Promise<Response>, key?: string) =>
  h(new Request("http://x/mcp", { method: "POST", headers: { "content-type": "application/json", ...(key ? { authorization: `Bearer ${key}` } : {}) }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }) }));
async function kv(entries: Record<string, string>) {
  const m = new Map<string, string>();
  for (const [k, v] of Object.entries(entries)) m.set(`key:${await sha256Hex(k)}`, v);
  return { get: async (k: string) => m.get(k) ?? null };
}
const tier = async (h: any, key?: string) => (await ping(h, key)).headers.get("x-provenpin-tier");

test("valid KV key is pro", async () => {
  assert.equal(await tier(createHandler(index, { proEnabled: "true", keyStore: await kv({ good: "label=test" }) }), "good"), "pro");
});
test("revoked KV key (marked or deleted) falls back to free", async () => {
  const h = createHandler(index, { proEnabled: "true", keyStore: await kv({ bad: "revoked 2026-10-15" }) });
  assert.equal(await tier(h, "bad"), "free");
  assert.equal(await tier(h, "deleted"), "free");
});
test("missing key is free and still served", async () => {
  const res = await ping(createHandler(index, { proEnabled: "true", apiKeys: "k", keyStore: await kv({ good: "x" }) }));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("x-provenpin-tier"), "free");
});
test("flag off ignores env and KV keys", async () => {
  for (const f of [undefined, "false", "TRUE", "1"]) {
    assert.equal(await tier(createHandler(index, { proEnabled: f, apiKeys: "k", keyStore: await kv({ k: "x" }) }), "k"), "free");
  }
});
test("KV errors fail closed to free", async () => {
  assert.equal(await tier(createHandler(index, { proEnabled: "true", keyStore: { get: async () => { throw new Error("down"); } } }), "k"), "free");
});
test("search limit cap: free 10, pro 25", () => {
  const big: RecipeIndex = { ...index, recipes: Array.from({ length: 30 }, (_, i) => ({ id: `r${i}`, title: "stripe", summary: "stripe", language: "typescript", runtime: "node", stack: ["stripe"], tags: [], pinned: {}, setup: "", test: "", files: [], receipt: { status: "passed", ran_at: "", last_passed_at: "" } }) as any) };
  const n = (t: "free" | "pro") => { const r: any = callTool(big, "search_recipes", { query: "stripe", limit: 100 }, t); return JSON.parse(r.content[0].text).results?.length ?? JSON.parse(r.content[0].text).length; };
  assert.equal(n("free"), 10);
  assert.equal(n("pro"), 25);
});
