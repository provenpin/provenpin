import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp, createUserSchema } from "../src/app.ts";

test("valid body gets defaults, trimming, lowercasing and unknown keys stripped", async () => {
  const res = await request(createApp())
    .post("/users")
    .send({ email: "Ada@Example.COM", name: "  Ada  ", isAdmin: true });
  assert.equal(res.status, 201);
  assert.deepEqual(res.body, { id: 1, email: "ada@example.com", name: "Ada", age: 18, role: "member" });
});

test("invalid body returns every error with its path", async () => {
  const res = await request(createApp()).post("/users").send({ email: "nope", age: 9, role: "root" });
  assert.equal(res.status, 400);
  const paths = res.body.errors.map((e: { path: string }) => e.path).sort();
  assert.deepEqual(paths, ["age", "email", "name", "role"]);
  const email = res.body.errors.find((e: { path: string }) => e.path === "email");
  assert.equal(email.type, "string.email");
});

test("query strings are converted to numbers with defaults", async () => {
  const res = await request(createApp()).get("/users?page=3");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { page: 3, limit: 20, sort: "name", total: 0 });
  const bad = await request(createApp()).get("/users?limit=500");
  assert.equal(bad.status, 400);
  assert.equal(bad.body.errors[0].type, "number.max");
});

test("schema can be used directly outside Express", () => {
  const { error, value } = createUserSchema.validate({ email: "a@b.co", name: "Al", age: "21" });
  assert.equal(error, undefined);
  assert.equal(value.age, 21);
});
