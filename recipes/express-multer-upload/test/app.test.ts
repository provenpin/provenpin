import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.ts";

test("accepts a small png", async () => {
  const res = await request(createApp()).post("/avatar").attach("avatar", Buffer.from("fakepng"), { filename: "a.png", contentType: "image/png" });
  assert.equal(res.status, 201);
  assert.equal(res.body.size, 7);
});

test("rejects the wrong type", async () => {
  const res = await request(createApp()).post("/avatar").attach("avatar", Buffer.from("hi"), { filename: "a.txt", contentType: "text/plain" });
  assert.equal(res.status, 400);
});

test("rejects files over the limit with 413", async () => {
  const res = await request(createApp()).post("/avatar").attach("avatar", Buffer.alloc(1024 * 1024 + 1), { filename: "big.png", contentType: "image/png" });
  assert.equal(res.status, 413);
  assert.equal(res.body.error, "LIMIT_FILE_SIZE");
});
