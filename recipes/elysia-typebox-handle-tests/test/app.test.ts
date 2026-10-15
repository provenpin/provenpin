import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.ts";

const KEY = { "x-api-key": "test-key", "content-type": "application/json" };
const req = (path: string, init: RequestInit = {}) => new Request(`http://localhost${path}`, init);

test("public route works without a key", async () => {
  const res = await createApp().handle(req("/health"));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test("guarded routes reject a missing API key", async () => {
  const res = await createApp().handle(req("/notes"));
  assert.equal(res.status, 401);
  assert.deepEqual(await res.json(), { error: "unauthorized" });
});

test("creates a note and coerces path and query params", async () => {
  const app = createApp();
  const created = await app.handle(req("/notes", { method: "POST", headers: KEY, body: JSON.stringify({ title: "Ship", body: "today", tags: ["work"] }) }));
  assert.equal(created.status, 201);
  assert.deepEqual(await created.json(), { id: 1, title: "Ship", body: "today", tags: ["work"] });
  await app.handle(req("/notes", { method: "POST", headers: KEY, body: JSON.stringify({ title: "Rest", body: "later" }) }));
  const one = await app.handle(req("/notes/1", { headers: KEY }));
  assert.equal((await one.json()).title, "Ship");
  const tagged = await (await app.handle(req("/notes?tag=work&limit=5", { headers: KEY }))).json();
  assert.deepEqual(tagged.map((n: { id: number }) => n.id), [1]);
  const limited = await (await app.handle(req("/notes?limit=1", { headers: KEY }))).json();
  assert.equal(limited.length, 1);
});

test("TypeBox validation failures map to 422 with paths", async () => {
  const app = createApp();
  const bad = await app.handle(req("/notes", { method: "POST", headers: KEY, body: JSON.stringify({ title: "", body: 3, tags: ["Bad Tag"] }) }));
  assert.equal(bad.status, 422);
  const { error, detail } = await bad.json();
  assert.equal(error, "validation");
  for (const p of ["/title", "/body", "/tags/0"]) assert.ok(detail.includes(p), `missing ${p} in ${detail}`);
  const badQuery = await app.handle(req("/notes?limit=500", { headers: KEY }));
  assert.equal(badQuery.status, 422);
  const badParam = await app.handle(req("/notes/abc", { headers: KEY }));
  assert.equal(badParam.status, 422);
});

test("unknown note ids return 404", async () => {
  const res = await createApp().handle(req("/notes/99", { headers: KEY }));
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: "note not found" });
});
