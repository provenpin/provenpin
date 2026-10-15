import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.ts";

test("rejects invalid user body", async () => {
  const res = await request(createApp()).post("/users").send({ email: "nope", age: 12, name: "" });
  assert.equal(res.status, 400);
  assert.ok(Array.isArray(res.body.errors));
  assert.ok(res.body.errors.length >= 2);
});

test("creates user when valid", async () => {
  const res = await request(createApp())
    .post("/users")
    .send({ email: "ada@example.com", age: "30", name: " Ada " });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.email, "ada@example.com");
  assert.equal(res.body.user.age, 30);
  assert.equal(res.body.user.name, "Ada");
});

test("validates search query", async () => {
  const bad = await request(createApp()).get("/search").query({ q: "a" });
  assert.equal(bad.status, 400);
  const ok = await request(createApp()).get("/search").query({ q: "ad", limit: "5" });
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.body, { q: "ad", limit: 5 });
});
