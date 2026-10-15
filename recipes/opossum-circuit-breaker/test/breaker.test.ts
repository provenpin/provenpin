import { test } from "node:test";
import assert from "node:assert/strict";
import { createPriceBreaker } from "../src/breaker.ts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test("opens after failures, serves fallback, then recovers", async () => {
  let healthy = false;
  let calls = 0;
  const { breaker, events } = createPriceBreaker(async (id) => {
    calls++;
    if (!healthy) throw new Error("upstream down");
    return { id, price: 42 };
  });

  assert.deepEqual(await breaker.fire("a"), { id: "a", price: -1, cached: true });
  assert.deepEqual(await breaker.fire("a"), { id: "a", price: -1, cached: true });
  assert.equal(breaker.opened, true);
  assert.deepEqual(events, ["open"]);

  const before = calls;
  await breaker.fire("a");
  assert.equal(calls, before, "open circuit must not call upstream");

  healthy = true;
  await sleep(80);
  assert.equal(breaker.halfOpen, true);
  assert.deepEqual(await breaker.fire("b"), { id: "b", price: 42 });
  assert.equal(breaker.closed, true);
  assert.deepEqual(events, ["open", "halfOpen", "close"]);
  assert.ok(breaker.stats.fallbacks >= 3);
  breaker.shutdown();
});

test("slow calls count as timeouts", async () => {
  const { breaker } = createPriceBreaker(async (id) => {
    await sleep(200);
    return { id, price: 1 };
  }, { timeout: 20 });
  const r = await breaker.fire("slow");
  assert.equal((r as { cached?: boolean }).cached, true);
  assert.equal(breaker.stats.timeouts, 1);
  breaker.shutdown();
});
