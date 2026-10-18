import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.ts";

test("GET valid path and query returns 200", async () => {
  const app = createApp();
  const res = await request(app).get("/items/abc-1").query({ verbose: "true" });
  assert.equal(res.status, 200);
  assert.equal(res.body.id, "abc-1");
  assert.equal(res.body.name, "Item abc-1");
  assert.equal(res.body.quantity, 1);
});

test("GET invalid path param returns 400 with details", async () => {
  const app = createApp();
  const res = await request(app).get("/items/BADID");
  assert.equal(res.status, 400);
  assert.ok(Array.isArray(res.body.errors));
  assert.ok(res.body.errors.length > 0);
});

test("GET invalid query returns 400 with details", async () => {
  const app = createApp();
  const res = await request(app).get("/items/abc-1").query({ verbose: "maybe" });
  assert.equal(res.status, 400);
  assert.ok(Array.isArray(res.body.errors));
  assert.ok(res.body.errors.length > 0);
});

test("POST valid JSON body returns 201", async () => {
  const app = createApp();
  const res = await request(app)
    .post("/items")
    .send({ name: "Widget", quantity: 3 });
  assert.equal(res.status, 201);
  assert.equal(res.body.name, "Widget");
  assert.equal(res.body.quantity, 3);
});

test("POST invalid JSON body returns 400 with details", async () => {
  const app = createApp();
  const res = await request(app)
    .post("/items")
    .send({ name: "", quantity: -1 });
  assert.equal(res.status, 400);
  assert.ok(Array.isArray(res.body.errors));
  assert.ok(res.body.errors.length > 0);
});
