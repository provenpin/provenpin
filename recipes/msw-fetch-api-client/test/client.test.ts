import { test, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { createClient, ApiError } from "../src/client.ts";

const BASE = "https://api.example.com";
const server = setupServer(
  http.get(`${BASE}/users/:id`, ({ params, request }) => {
    if (request.headers.get("authorization") !== "Bearer t") return new HttpResponse(null, { status: 401 });
    return HttpResponse.json({ id: Number(params.id), name: "Ada", email: "ada@example.com" });
  }),
  http.post(`${BASE}/users`, async ({ request }) => HttpResponse.json({ id: 7, ...(await request.json() as object) }, { status: 201 })),
);
before(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
after(() => server.close());

test("gets and parses a user", async () => {
  assert.deepEqual(await createClient(BASE, "t").getUser(1), { id: 1, name: "Ada", email: "ada@example.com" });
});

test("posts a user", async () => {
  const u = await createClient(BASE, "t").createUser({ name: "Bo", email: "bo@example.com" });
  assert.equal(u.id, 7);
});

test("throws ApiError on 401", async () => {
  await assert.rejects(createClient(BASE, "bad").getUser(1), (e) => e instanceof ApiError && e.status === 401);
});

test("rejects malformed payloads", async () => {
  server.use(http.get(`${BASE}/users/:id`, () => HttpResponse.json({ id: "x" })));
  await assert.rejects(createClient(BASE, "t").getUser(1));
});
