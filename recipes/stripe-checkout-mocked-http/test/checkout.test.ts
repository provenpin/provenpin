import { test } from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { createCheckout } from "../src/checkout.ts";

function fakeStripe(status: number, body: object, seen: { url: string; headers: Headers; body: URLSearchParams }[]) {
  const fetchFn = async (url: any, init: any) => {
    seen.push({ url: String(url), headers: new Headers(init.headers), body: new URLSearchParams(init.body) });
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "request-id": "req_1" } });
  };
  return new Stripe("sk_test_123", { httpClient: Stripe.createFetchHttpClient(fetchFn as any), maxNetworkRetries: 0 });
}

test("sends line items, metadata and idempotency key", async () => {
  const seen: any[] = [];
  const s = await createCheckout(fakeStripe(200, { id: "cs_test_1", object: "checkout.session", url: "https://checkout.stripe.com/c/pay/cs_test_1" }, seen), "ord_9", [{ priceId: "price_a", qty: 2 }], "https://shop.test");
  assert.equal(s.id, "cs_test_1");
  const req = seen[0];
  assert.match(req.url, /\/v1\/checkout\/sessions$/);
  assert.equal(req.body.get("line_items[0][price]"), "price_a");
  assert.equal(req.body.get("line_items[0][quantity]"), "2");
  assert.equal(req.body.get("metadata[orderId]"), "ord_9");
  assert.equal(req.headers.get("idempotency-key"), "checkout-ord_9");
});

test("Stripe errors become typed exceptions", async () => {
  const stripe = fakeStripe(400, { error: { type: "invalid_request_error", message: "No such price: 'price_x'", param: "line_items[0][price]" } }, []);
  await assert.rejects(createCheckout(stripe, "o1", [{ priceId: "price_x", qty: 1 }], "https://shop.test"), (e: any) => e instanceof Stripe.errors.StripeInvalidRequestError && /No such price/.test(e.message));
});

test("rejects an empty cart before calling Stripe", async () => {
  const seen: any[] = [];
  await assert.rejects(createCheckout(fakeStripe(200, {}, seen), "o1", [], "https://x"), /empty cart/);
  assert.equal(seen.length, 0);
});
