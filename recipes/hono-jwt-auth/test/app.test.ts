import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.ts";

const app = createApp("test-secret");
const post = (body: unknown) => app.request("/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

test("login returns a token that unlocks /me", async () => {
  const { token } = await (await post({ username: "ada", password: "lovelace" })).json();
  const res = await app.request("/me/profile", { headers: { authorization: `Bearer ${token}` } });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { user: "ada" });
});

test("wrong password is 401", async () => {
  assert.equal((await post({ username: "ada", password: "x" })).status, 401);
});

test("invalid body is 400", async () => {
  assert.equal((await post({ username: "" })).status, 400);
});

test("no token is 401", async () => {
  assert.equal((await app.request("/me/profile")).status, 401);
});
