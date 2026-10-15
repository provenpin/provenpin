import { test } from "node:test";
import assert from "node:assert/strict";
import { describeEvent, totalUsd, type Event } from "../src/events.ts";

test("exhaustive descriptions", () => {
  assert.equal(describeEvent({ type: "user_created", id: "1", email: "a@b.co" }), "created a@b.co");
  assert.equal(describeEvent({ type: "payment", id: "p1", amount: 12, currency: "USD" }), "charge $12");
  assert.equal(describeEvent({ type: "refund", id: "r1", amount: 5, currency: "USD", paymentId: "p1" }), "refund 5 USD for p1");
});

test("totals usd payments and refunds", () => {
  const events: Event[] = [
    { type: "payment", id: "1", amount: 20, currency: "USD" },
    { type: "payment", id: "2", amount: 5, currency: "EUR" },
    { type: "refund", id: "3", amount: 3, currency: "USD", paymentId: "1" },
  ];
  assert.equal(totalUsd(events), 17);
});
