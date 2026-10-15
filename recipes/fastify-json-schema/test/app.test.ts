import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "../src/app.ts";

test("valid body, response schema strips extra fields", async () => {
  const res = await build().inject({ method: "POST", url: "/items", payload: { name: "bolt", qty: 3 } });
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.json(), { id: 1, name: "bolt", qty: 3 });
});
test("invalid body is 400", async () => {
  const res = await build().inject({ method: "POST", url: "/items", payload: { name: "", qty: 0 } });
  assert.equal(res.statusCode, 400);
});
