import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.ts";

test("accepts a valid body and coerces age", async () => {
  const app = await createApp();
  const res = await request(app.getHttpServer()).post("/users").send({ email: "a@example.com", name: "Ada", age: "30" });
  assert.equal(res.status, 201);
  assert.equal(res.body.age, 30);
  await app.close();
});

test("rejects invalid body with field errors", async () => {
  const app = await createApp();
  const res = await request(app.getHttpServer()).post("/users").send({ email: "nope", name: "x" });
  assert.equal(res.status, 400);
  assert.ok(res.body.message?.issues?.email || res.body.issues?.email || res.body.message);
  await app.close();
});
