import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { MockAgent } from "undici";
import { createClient, HttpError } from "../src/client.ts";

const BASE = "https://api.example.test";
let agent: MockAgent;

beforeEach(() => {
  agent = new MockAgent();
  agent.disableNetConnect(); // any unmocked request fails instead of reaching the network
});
afterEach(async () => {
  agent.assertNoPendingInterceptors();
  await agent.close();
});

test("returns parsed JSON on the first try", async () => {
  agent.get(BASE).intercept({ path: "/users/1", method: "GET" }).reply(200, { id: 1, name: "Ada" }, { headers: { "content-type": "application/json" } });
  const c = createClient({ baseUrl: BASE, dispatcher: agent });
  assert.deepEqual(await c.getJson("/users/1"), { id: 1, name: "Ada" });
  assert.deepEqual(c.attempts, [1]);
});

test("retries 503 and 429 then succeeds", async () => {
  const pool = agent.get(BASE);
  pool.intercept({ path: "/flaky" }).reply(503, "down");
  pool.intercept({ path: "/flaky" }).reply(429, "slow down");
  pool.intercept({ path: "/flaky" }).reply(200, { ok: true });
  const c = createClient({ baseUrl: BASE, dispatcher: agent });
  assert.deepEqual(await c.getJson("/flaky"), { ok: true });
  assert.deepEqual(c.attempts, [1, 2, 3]);
});

test("does not retry a 404", async () => {
  agent.get(BASE).intercept({ path: "/missing" }).reply(404, "nope");
  const c = createClient({ baseUrl: BASE, dispatcher: agent });
  await assert.rejects(c.getJson("/missing"), (e: unknown) => e instanceof HttpError && e.status === 404 && e.body === "nope");
  assert.deepEqual(c.attempts, [1]);
});

test("gives up after the retry budget with the last error", async () => {
  agent.get(BASE).intercept({ path: "/always-500" }).reply(500, "boom").times(3);
  const c = createClient({ baseUrl: BASE, dispatcher: agent, retries: 2 });
  await assert.rejects(c.getJson("/always-500"), (e: unknown) => e instanceof HttpError && e.status === 500);
  assert.equal(c.attempts.length, 3);
});

test("retries network errors from replyWithError", async () => {
  const pool = agent.get(BASE);
  pool.intercept({ path: "/net" }).replyWithError(new Error("ECONNRESET"));
  pool.intercept({ path: "/net" }).reply(200, { recovered: true });
  const c = createClient({ baseUrl: BASE, dispatcher: agent });
  assert.deepEqual(await c.getJson("/net"), { recovered: true });
  assert.equal(c.attempts.length, 2);
});
