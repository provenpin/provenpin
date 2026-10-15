import { test } from "node:test";
import assert from "node:assert/strict";
import { app, reset } from "../src/app.ts";
import { makeClient } from "../src/client.ts";

test("rpc client creates and fetches an item", async () => {
  reset();
  const client = makeClient("http://local", (input, init) => app.request(input, init));
  const created = await client.items.$post({ json: { name: "bolt", qty: 3 } });
  assert.equal(created.status, 201);
  const body = await created.json();
  assert.equal(body.name, "bolt");
  const got = await client.items[":id"].$get({ param: { id: String(body.id) } });
  assert.equal(got.status, 200);
  assert.deepEqual(await got.json(), body);
});

test("invalid body is 400", async () => {
  reset();
  const res = await app.request("/items", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "x", qty: 0 }),
  });
  assert.equal(res.status, 400);
});
