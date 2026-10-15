import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.ts";

test("sets security headers", async () => {
  const res = await request(createApp()).get("/api/ping");
  assert.equal(res.status, 200);
  assert.equal(res.headers["x-content-type-options"], "nosniff");
  assert.ok(res.headers["content-security-policy"]);
  assert.equal(res.headers["x-powered-by"], undefined);
});

test("returns 429 after the limit", async () => {
  const app = createApp({ limit: 2 });
  await request(app).get("/api/ping").expect(200);
  await request(app).get("/api/ping").expect(200);
  const res = await request(app).get("/api/ping");
  assert.equal(res.status, 429);
  assert.ok(res.headers["ratelimit"] || res.headers["ratelimit-policy"]);
});
