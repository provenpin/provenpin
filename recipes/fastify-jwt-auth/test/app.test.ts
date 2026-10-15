import { test } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.ts";

test("login then access /me", async () => {
  const app = buildApp("test-secret");
  const login = await app.inject({ method: "POST", url: "/login", payload: { username: "ada", password: "secret" } });
  assert.equal(login.statusCode, 200);
  const me = await app.inject({ method: "GET", url: "/me", headers: { authorization: `Bearer ${login.json().token}` } });
  assert.deepEqual(me.json(), { user: "ada" });
  await app.close();
});

test("rejects missing or bad tokens", async () => {
  const app = buildApp("test-secret");
  assert.equal((await app.inject({ method: "GET", url: "/me" })).statusCode, 401);
  assert.equal((await app.inject({ method: "GET", url: "/me", headers: { authorization: "Bearer nope" } })).statusCode, 401);
  await app.close();
});

test("schema rejects incomplete login body", async () => {
  const app = buildApp("test-secret");
  assert.equal((await app.inject({ method: "POST", url: "/login", payload: { username: "ada" } })).statusCode, 400);
  await app.close();
});
