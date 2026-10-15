import { test } from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/app.ts";

test("valid json passes", async () => {
  const res = await app.request("/posts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: "Hello", body: "x" }) });
  assert.equal(res.status, 201);
});
test("invalid json is 400", async () => {
  const res = await app.request("/posts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: "Hi" }) });
  assert.equal(res.status, 400);
});
test("query is coerced", async () => {
  const res = await app.request("/posts?page=3");
  assert.deepEqual(await res.json(), { page: 3 });
});
