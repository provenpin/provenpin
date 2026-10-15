import { test } from "node:test";
import assert from "node:assert/strict";
import { Writable } from "node:stream";
import request from "supertest";
import { createApp } from "../src/app.ts";

function capture() {
  const lines: any[] = [];
  const stream = new Writable({ write(chunk, _e, cb) { lines.push(JSON.parse(chunk.toString())); cb(); } });
  return { lines, stream };
}

test("logs with request id and redacts auth", async () => {
  const { lines, stream } = capture();
  const res = await request(createApp(stream as any)).get("/orders/42").set("x-request-id", "req-1").set("authorization", "Bearer secret");
  assert.equal(res.headers["x-request-id"], "req-1");
  const custom = lines.find((l) => l.msg === "loading order");
  assert.equal(custom.orderId, "42");
  assert.equal(custom.req.id, "req-1");
  const done = lines.find((l) => l.res?.statusCode === 200);
  assert.ok(done);
  assert.equal(done.req.headers.authorization, "[Redacted]");
});

test("generates a request id when none is sent", async () => {
  const { stream } = capture();
  const res = await request(createApp(stream as any)).get("/orders/1");
  assert.match(res.headers["x-request-id"], /^[0-9a-f-]{36}$/);
});
