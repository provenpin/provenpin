import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.ts";

const app = createApp();

test("returns a known user", async () => {
  const res = await request(app).get("/users/1");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { id: "1", email: "a@example.com" });
});

test("maps a thrown 404 to problem details", async () => {
  const res = await request(app).get("/users/999");
  assert.equal(res.status, 404);
  assert.match(String(res.headers["content-type"]), /application\/problem\+json/);
  assert.equal(res.body.type, "https://example.com/problems/404");
  assert.equal(res.body.title, "Not Found");
  assert.equal(res.body.status, 404);
  assert.equal(res.body.detail, "User not found");
  assert.equal(res.body.instance, "/users/999");
});

test("exposes custom properties on a 422", async () => {
  const res = await request(app).post("/users").send({ email: "not-an-email" });
  assert.equal(res.status, 422);
  assert.equal(res.body.title, "Unprocessable Entity");
  assert.equal(res.body.detail, "Validation failed");
  assert.deepEqual(res.body.errors, [
    { field: "email", message: "must be a valid email" },
  ]);
});

test("forwards async route rejections", async () => {
  const res = await request(app).get("/reports/7");
  assert.equal(res.status, 404);
  assert.equal(res.body.detail, "Report 7 not found");
});

test("serves an exposed 5xx message when opted in", async () => {
  const res = await request(app).get("/maintenance");
  assert.equal(res.status, 503);
  assert.equal(res.body.detail, "Down for maintenance");
});

test("hides the message of an unexposed 500", async () => {
  const res = await request(app).get("/boom");
  assert.equal(res.status, 500);
  assert.equal(res.body.title, "Internal Server Error");
  assert.equal(res.body.detail, "Internal Server Error");
  assert.equal(JSON.stringify(res.body).includes("secret"), false);
});

test("returns problem details for unknown routes", async () => {
  const res = await request(app).get("/missing");
  assert.equal(res.status, 404);
  assert.equal(res.body.detail, "Route not found");
});
