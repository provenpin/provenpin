import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import nock from "nock";
import { createClient } from "../src/client.ts";

process.env.NODE_ENV = "test";
const BASE = "https://api.example.com";
afterEach(() => nock.cleanAll());

test("retries 503 then succeeds", async () => {
  nock(BASE).get("/items").reply(503).get("/items").reply(503).get("/items").reply(200, [{ id: 1 }]);
  const res = await createClient(BASE).get("/items");
  assert.deepEqual(res.data, [{ id: 1 }]);
  assert.equal(res.config["axios-retry"]?.retryCount, 2);
});

test("retries 429", async () => {
  nock(BASE).get("/items").reply(429).get("/items").reply(200, []);
  assert.equal((await createClient(BASE).get("/items")).status, 200);
});

test("does not retry non-idempotent POST on 500", async () => {
  const scope = nock(BASE).post("/items").reply(500);
  await assert.rejects(createClient(BASE).post("/items", {}));
  assert.ok(scope.isDone());
});

test("gives up after the retry limit", async () => {
  nock(BASE).get("/items").times(3).reply(500);
  await assert.rejects(createClient(BASE, 2).get("/items"), (e: any) => e.response.status === 500);
});
