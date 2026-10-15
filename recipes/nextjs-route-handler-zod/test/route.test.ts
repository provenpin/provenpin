import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET, POST } from "../app/api/todos/route.ts";

const post = (body: string) => POST(new NextRequest("http://localhost/api/todos", { method: "POST", body, headers: { "content-type": "application/json" } }));

test("creates a todo with defaults", async () => {
  const res = await post(JSON.stringify({ title: "  ship it  " }));
  assert.equal(res.status, 201);
  assert.deepEqual(await res.json(), { id: 1, title: "ship it", done: false });
});

test("400 on bad body and bad JSON", async () => {
  const bad = await post(JSON.stringify({ title: "" }));
  assert.equal(bad.status, 400);
  assert.ok((await bad.json()).issues.title);
  assert.equal((await post("{oops")).status, 400);
});

test("validates and coerces query params", async () => {
  assert.equal((await GET(new NextRequest("http://localhost/api/todos?limit=1"))).status, 200);
  assert.equal((await GET(new NextRequest("http://localhost/api/todos?limit=999"))).status, 400);
});
