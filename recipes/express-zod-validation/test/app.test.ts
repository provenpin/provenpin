import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.ts";

test("accepts a valid body", async () => {
  const res = await request(createApp()).post("/users").send({ email: "a@example.com", name: "Ada" });
  assert.equal(res.status, 201);
  assert.equal(res.body.email, "a@example.com");
});

test("rejects an invalid body with field errors", async () => {
  const res = await request(createApp()).post("/users").send({ email: "nope", name: "" });
  assert.equal(res.status, 400);
  assert.ok(res.body.issues.email);
  assert.ok(res.body.issues.name);
});

test("strips unknown keys", async () => {
  const res = await request(createApp()).post("/users").send({ email: "b@example.com", name: "B", admin: true });
  assert.equal(res.status, 201);
  assert.equal(res.body.admin, undefined);
});
