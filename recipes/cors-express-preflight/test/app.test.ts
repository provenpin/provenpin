import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.ts";

test("reflects an allowed origin on a simple request", async () => {
  const app = createApp();
  const res = await request(app)
    .get("/health")
    .set("Origin", "https://app.example.com");

  assert.equal(res.status, 200);
  assert.equal(res.headers["access-control-allow-origin"], "https://app.example.com");
  assert.equal(res.headers["access-control-allow-credentials"], "true");
  assert.deepEqual(res.body, { ok: true });
});

test("answers OPTIONS preflight with Access-Control-Allow-* headers", async () => {
  const app = createApp();
  const res = await request(app)
    .options("/echo")
    .set("Origin", "https://admin.example.com")
    .set("Access-Control-Request-Method", "POST")
    .set("Access-Control-Request-Headers", "content-type");

  assert.equal(res.status, 204);
  assert.equal(res.headers["access-control-allow-origin"], "https://admin.example.com");
  assert.equal(res.headers["access-control-allow-credentials"], "true");
  assert.match(res.headers["access-control-allow-methods"], /POST/);
  assert.match(res.headers["access-control-allow-headers"], /content-type/i);
});

test("denies a disallowed origin by omitting the allow-origin header", async () => {
  const app = createApp();
  const res = await request(app)
    .get("/health")
    .set("Origin", "https://evil.example.com");

  assert.equal(res.headers["access-control-allow-origin"], undefined);
  assert.equal(res.headers["access-control-allow-credentials"], undefined);
});
