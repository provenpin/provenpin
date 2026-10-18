import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.ts";

test("resolves async handler with router-level params", async () => {
  const app = createApp();
  const res = await request(app).get("/users/u1/orders/o2");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { userId: "u1", orderId: "o2" });
});

test("rejected async handler reaches error middleware without try/catch", async () => {
  const app = createApp();
  const res = await request(app).get("/boom");
  assert.equal(res.status, 500);
  assert.deepEqual(res.body, { error: "internal_error", message: "kaboom" });
});

test("unknown route returns JSON 404", async () => {
  const app = createApp();
  const res = await request(app).get("/nope");
  assert.equal(res.status, 404);
  assert.deepEqual(res.body, { error: "not_found", path: "/nope" });
});
