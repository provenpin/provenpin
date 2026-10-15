import { test } from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";
const { POST, fulfilled } = await import("../app/api/stripe/webhook/route.ts");
const stripe = new Stripe("sk_test_placeholder");

function signed(payload: object, secret = "whsec_test_secret") {
  const body = JSON.stringify(payload);
  const header = stripe.webhooks.generateTestHeaderString({ payload: body, secret });
  return new Request("http://localhost/api/stripe/webhook", { method: "POST", body, headers: { "stripe-signature": header } });
}
const evt = { id: "evt_1", object: "event", type: "checkout.session.completed", data: { object: { id: "cs_test_123", object: "checkout.session" } } };

test("fulfills a correctly signed checkout event", async () => {
  const res = await POST(signed(evt));
  assert.equal(res.status, 200);
  assert.ok(fulfilled.includes("cs_test_123"));
});
test("rejects a bad signature", async () => {
  const res = await POST(signed(evt, "whsec_wrong"));
  assert.equal(res.status, 400);
});
test("rejects a missing signature", async () => {
  const res = await POST(new Request("http://localhost/x", { method: "POST", body: "{}" }));
  assert.equal(res.status, 400);
});
