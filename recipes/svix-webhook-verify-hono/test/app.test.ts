import { test } from "node:test";
import assert from "node:assert/strict";
import { Webhook } from "svix";
import { makeApp, type Event } from "../src/app.ts";

// Svix secrets are base64 with a whsec_ prefix.
const SECRET = "whsec_" + Buffer.from("provenpin-test-secret-32-bytes!!").toString("base64");
const signer = new Webhook(SECRET);

function signed(body: string, id: string, ts = new Date()) {
  return {
    method: "POST",
    body,
    headers: {
      "content-type": "application/json",
      "svix-id": id,
      "svix-timestamp": String(Math.floor(ts.getTime() / 1000)),
      "svix-signature": signer.sign(id, ts, body),
    },
  };
}

test("valid signature is accepted and parsed", async () => {
  const got: [Event, string][] = [];
  const app = makeApp(SECRET, (e, id) => got.push([e, id]));
  const body = JSON.stringify({ type: "user.created", data: { id: "u_1" } });
  const res = await app.request("/webhooks", signed(body, "msg_1"));
  assert.equal(res.status, 200);
  assert.deepEqual(got, [[{ type: "user.created", data: { id: "u_1" } }, "msg_1"]]);
});

test("tampered body is rejected", async () => {
  const app = makeApp(SECRET, () => assert.fail("should not run"));
  const req = signed(JSON.stringify({ type: "a", data: {} }), "msg_2");
  req.body = JSON.stringify({ type: "b", data: {} });
  const res = await app.request("/webhooks", req);
  assert.equal(res.status, 400);
});

test("stale timestamp is rejected (replay protection)", async () => {
  const app = makeApp(SECRET, () => assert.fail("should not run"));
  const old = new Date(Date.now() - 10 * 60 * 1000);
  const res = await app.request("/webhooks", signed(JSON.stringify({ type: "a", data: {} }), "msg_3", old));
  assert.equal(res.status, 400);
  assert.match(((await res.json()) as { error: string }).error, /timestamp/i);
});

test("missing headers are rejected", async () => {
  const app = makeApp(SECRET, () => {});
  const res = await app.request("/webhooks", { method: "POST", body: "{}" });
  assert.equal(res.status, 400);
});

test("duplicate svix-id is acknowledged once", async () => {
  let n = 0;
  const app = makeApp(SECRET, () => n++);
  const body = JSON.stringify({ type: "invoice.paid", data: {} });
  await app.request("/webhooks", signed(body, "msg_4"));
  const again = await app.request("/webhooks", signed(body, "msg_4"));
  assert.deepEqual(await again.json(), { ok: true, duplicate: true });
  assert.equal(n, 1);
});

test("signature from another secret fails", async () => {
  const other = new Webhook("whsec_" + Buffer.from("another-secret-another-secret-xx").toString("base64"));
  const app = makeApp(SECRET, () => {});
  const body = "{\"type\":\"x\",\"data\":{}}";
  const ts = new Date();
  const res = await app.request("/webhooks", {
    method: "POST", body,
    headers: { "svix-id": "m", "svix-timestamp": String(Math.floor(ts.getTime() / 1000)), "svix-signature": other.sign("m", ts, body) },
  });
  assert.equal(res.status, 400);
});
