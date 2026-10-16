import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import Hapi from "@hapi/hapi";
import { createServer } from "../src/server.ts";

let server: Hapi.Server;

before(async () => {
  server = createServer();
  await server.initialize();
});

after(async () => {
  await server.stop();
});

test("GET /users/{id} returns the user for a valid id", async () => {
  const res = await server.inject({ method: "GET", url: "/users/u_ada" });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.result, { id: "u_ada", name: "Ada" });
});

test("GET /users/{id} rejects an invalid id with 400", async () => {
  const res = await server.inject({ method: "GET", url: "/users/123" });
  assert.equal(res.statusCode, 400);
  const payload = res.result as { error: string };
  assert.equal(payload.error, "Bad Request");
});

test("GET /users/{id} returns a Boom 404 for a missing user", async () => {
  const res = await server.inject({ method: "GET", url: "/users/u_missing" });
  assert.equal(res.statusCode, 404);
  const payload = res.result as { error: string; message: string };
  assert.equal(payload.error, "Not Found");
  assert.equal(payload.message, "User u_missing was not found");
});

test("POST /users accepts a valid payload with 201", async () => {
  const res = await server.inject({
    method: "POST",
    url: "/users",
    payload: { name: "Ada", email: "ada@example.com" },
  });
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.result, {
    id: "u_ada",
    name: "Ada",
    email: "ada@example.com",
  });
});

test("POST /users rejects an invalid payload with 400", async () => {
  const res = await server.inject({
    method: "POST",
    url: "/users",
    payload: { name: "Ada", email: "not-an-email" },
  });
  assert.equal(res.statusCode, 400);
  const payload = res.result as { error: string };
  assert.equal(payload.error, "Bad Request");
});

test("GET /search validates and coerces the query string", async () => {
  const ok = await server.inject({
    method: "GET",
    url: "/search?q=hapi&limit=5",
  });
  assert.equal(ok.statusCode, 200);
  assert.deepEqual(ok.result, { q: "hapi", limit: 5 });

  const fallback = await server.inject({ method: "GET", url: "/search?q=hapi" });
  assert.equal(fallback.statusCode, 200);
  assert.deepEqual(fallback.result, { q: "hapi", limit: 10 });

  const bad = await server.inject({ method: "GET", url: "/search" });
  assert.equal(bad.statusCode, 400);
});
