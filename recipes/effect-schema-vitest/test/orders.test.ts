import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Fiber } from "effect";
import { TestClock } from "effect/testing";
import { parseOrder, encodeOrder, fetchOrder, Order, UpstreamUnavailable } from "../src/orders.ts";

const raw = JSON.stringify({ id: "o-1", customer: "  Ada  ", status: "paid", items: [{ sku: "HAT-001", qty: 2, unitCents: "2499" }, { sku: "GLV-010", qty: 1, unitCents: "899" }] });

describe("Effect Schema orders", () => {
  it.effect("decodes JSON into class instances with transformations applied", () =>
    Effect.gen(function* () {
      const order = yield* parseOrder(raw);
      assert.isTrue(order instanceof Order);
      assert.strictEqual(order.customer, "Ada");
      assert.strictEqual(order.items[0].unitCents, 2499);
      assert.strictEqual(order.totalCents, 2 * 2499 + 899);
      assert.isFalse("note" in order);
    }));

  it.effect("encodes back to the wire format", () =>
    Effect.gen(function* () {
      const order = yield* parseOrder(raw);
      const json = JSON.parse(yield* encodeOrder(order));
      assert.strictEqual(json.items[0].unitCents, "2499");
      assert.strictEqual(json.customer, "Ada");
    }));

  it.effect("invalid input fails with a typed InvalidOrder error", () =>
    Effect.gen(function* () {
      const bad = JSON.stringify({ id: "o-2", customer: " ", status: "lost", items: [{ sku: "bad", qty: 0, unitCents: "x" }] });
      const exit = yield* Effect.exit(parseOrder(bad));
      assert.isTrue(Exit.isFailure(exit));
      const err = yield* Effect.flip(parseOrder(bad));
      assert.strictEqual(err._tag, "InvalidOrder");
      for (const field of ["customer", "status", "sku", "qty", "unitCents"]) assert.include(err.message, field);
      const notJson = yield* Effect.flip(parseOrder("{oops"));
      assert.strictEqual(notJson._tag, "InvalidOrder");
    }));

  it.effect("retries the upstream with backoff on the TestClock", () =>
    Effect.gen(function* () {
      const calls: number[] = [];
      const upstream = (attempt: number) => {
        calls.push(attempt);
        return attempt < 3 ? Effect.fail(new UpstreamUnavailable({ attempt })) : Effect.succeed(raw);
      };
      const fiber = yield* Effect.forkChild(fetchOrder(upstream));
      yield* TestClock.adjust("100 millis");
      yield* TestClock.adjust("200 millis");
      const order = yield* Fiber.join(fiber);
      assert.deepStrictEqual(calls, [1, 2, 3]);
      assert.strictEqual(order.status, "paid");
    }));

  it.effect("gives up after the retry budget with the last upstream error", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.forkChild(Effect.flip(fetchOrder((attempt) => Effect.fail(new UpstreamUnavailable({ attempt })))));
      yield* TestClock.adjust("10 seconds");
      const err = yield* Fiber.join(fiber);
      assert.strictEqual(err._tag, "UpstreamUnavailable");
      assert.strictEqual((err as UpstreamUnavailable).attempt, 4);
    }));
});
