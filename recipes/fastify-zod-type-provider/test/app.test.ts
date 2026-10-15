import { test } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.ts";

test("valid body and response schema strips extra fields", async () => {
  const app = buildApp();
  const r = await app.inject({ method: "POST", url: "/users", payload: { email: "a@example.com", age: 30 } });
  assert.equal(r.statusCode, 201);
  assert.deepEqual(r.json(), { id: 1, email: "a@example.com" });
  await app.close();
});

test("invalid body is 400", async () => {
  const app = buildApp();
  const r = await app.inject({ method: "POST", url: "/users", payload: { email: "nope", age: 5 } });
  assert.equal(r.statusCode, 400);
  await app.close();
});

test("querystring coercion and defaults", async () => {
  const app = buildApp();
  assert.deepEqual((await app.inject({ url: "/search?q=pin" })).json(), { q: "pin", page: 1 });
  assert.deepEqual((await app.inject({ url: "/search?q=pin&page=3" })).json(), { q: "pin", page: 3 });
  assert.equal((await app.inject({ url: "/search" })).statusCode, 400);
  await app.close();
});
