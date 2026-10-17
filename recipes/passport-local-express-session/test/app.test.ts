import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.ts";

test("rejects a bad password", async () => {
  const agent = request.agent(createApp());
  const res = await agent
    .post("/login")
    .type("form")
    .send({ username: "alice", password: "wrong" });

  assert.equal(res.status, 401);
  assert.equal(res.body.error, "invalid credentials");
});

test("login sets a session and the protected route returns the user", async () => {
  const agent = request.agent(createApp());

  const login = await agent
    .post("/login")
    .type("form")
    .send({ username: "alice", password: "secret" });

  assert.equal(login.status, 200);
  assert.equal(login.body.user.username, "alice");
  assert.equal(login.body.user.password, undefined);
  assert.ok(login.headers["set-cookie"]);

  const me = await agent.get("/me");
  assert.equal(me.status, 200);
  assert.equal(me.body.user.username, "alice");
});

test("protected route rejects anonymous requests", async () => {
  const res = await request(createApp()).get("/me");
  assert.equal(res.status, 401);
});
