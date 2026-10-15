import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.ts";

const app = createApp("test-secret");
const login = async (username: string) => (await request(app).post("/login").send({ username, password: "secret" })).body.token;

test("token unlocks /me", async () => {
  const res = await request(app).get("/me").set("authorization", `Bearer ${await login("ada")}`);
  assert.deepEqual(res.body, { id: "ada", role: "user" });
});

test("role check", async () => {
  assert.equal((await request(app).get("/admin").set("authorization", `Bearer ${await login("ada")}`)).status, 403);
  assert.equal((await request(app).get("/admin").set("authorization", `Bearer ${await login("root")}`)).status, 200);
});

test("rejects missing, forged and expired tokens", async () => {
  assert.equal((await request(app).get("/me")).status, 401);
  const forged = jwt.sign({ role: "admin" }, "other", { subject: "x" });
  assert.equal((await request(app).get("/me").set("authorization", `Bearer ${forged}`)).status, 401);
  const expired = jwt.sign({ role: "user", exp: Math.floor(Date.now() / 1000) - 10 }, "test-secret", { subject: "x" });
  assert.equal((await request(app).get("/me").set("authorization", `Bearer ${expired}`)).status, 401);
});
