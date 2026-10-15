import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../src/app.ts";

const server = () => createApp().callback();

test("creates a todo with defaults and a Location header", async () => {
  const res = await request(server()).post("/todos").send({ title: "  write recipe  " }).expect(201);
  assert.deepEqual(res.body, { id: 1, title: "write recipe", done: false });
  assert.equal(res.headers.location, "/todos/1");
});

test("rejects an invalid body with 400 and field issues", async () => {
  const res = await request(server()).post("/todos").send({ title: "", done: "yes" }).expect(400);
  assert.equal(res.body.error, "validation_failed");
  const paths = res.body.issues.map((i: { path: string }) => i.path).sort();
  assert.deepEqual(paths, ["done", "title"]);
});

test("patches, filters and deletes", async () => {
  const app = server();
  await request(app).post("/todos").send({ title: "a" }).expect(201);
  await request(app).post("/todos").send({ title: "b" }).expect(201);
  const patched = await request(app).patch("/todos/2").send({ done: true }).expect(200);
  assert.equal(patched.body.done, true);
  const done = await request(app).get("/todos?done=true").expect(200);
  assert.deepEqual(done.body.map((t: { title: string }) => t.title), ["b"]);
  await request(app).delete("/todos/1").expect(204);
  const all = await request(app).get("/todos").expect(200);
  assert.equal(all.body.length, 1);
});

test("returns 404 for unknown ids and 400 for bad ids", async () => {
  const app = server();
  await request(app).patch("/todos/99").send({ done: true }).expect(404);
  await request(app).delete("/todos/abc").expect(400);
});

test("answers 405 for unsupported methods via allowedMethods", async () => {
  await request(server()).put("/todos").send({}).expect(405);
});
