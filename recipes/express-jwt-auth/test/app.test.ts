import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.ts";

test("login then access protected route", async () => {
  const app = createApp();
  const login = await request(app).post("/login").send({ username: "ada", password: "correct-horse" });
  assert.equal(login.status, 200);
  const me = await request(app).get("/me").set("authorization", `Bearer ${login.body.token}`);
  assert.deepEqual(me.body, { sub: "ada" });
});
test("rejects missing and forged tokens", async () => {
  const app = createApp();
  assert.equal((await request(app).get("/me")).status, 401);
  const forged = jwt.sign({ sub: "x" }, "other-secret");
  assert.equal((await request(app).get("/me").set("authorization", `Bearer ${forged}`)).status, 401);
});
