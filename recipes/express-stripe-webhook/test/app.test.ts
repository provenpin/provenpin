import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import Stripe from "stripe";
import { createApp } from "../src/app.ts";

const stripe = new Stripe("sk_test_dummy");
const secret = "whsec_test_secret";
const payload = JSON.stringify({ id: "evt_1", object: "event", type: "checkout.session.completed", data: { object: { id: "cs_1" } } });

test("accepts a correctly signed event", async () => {
  const seen: string[] = [];
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
  const res = await request(createApp(stripe, secret, (e) => seen.push(e.type)))
    .post("/webhooks/stripe").set("content-type", "application/json").set("stripe-signature", header).send(payload);
  assert.equal(res.status, 200);
  assert.deepEqual(seen, ["checkout.session.completed"]);
});

test("rejects a bad signature", async () => {
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_wrong" });
  const res = await request(createApp(stripe, secret, () => {}))
    .post("/webhooks/stripe").set("content-type", "application/json").set("stripe-signature", header).send(payload);
  assert.equal(res.status, 400);
});

test("rejects a missing signature", async () => {
  const res = await request(createApp(stripe, secret, () => {})).post("/webhooks/stripe").set("content-type", "application/json").send(payload);
  assert.equal(res.status, 400);
});
