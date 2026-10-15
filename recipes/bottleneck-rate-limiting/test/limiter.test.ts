import { test } from "node:test";
import assert from "node:assert/strict";
import { createLimiter, callAll } from "../src/limiter.ts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test("never exceeds maxConcurrent", async () => {
  const limiter = createLimiter({ maxConcurrent: 2 });
  let active = 0, peak = 0;
  await callAll(limiter, ["a", "b", "c", "d", "e"], async () => {
    active++; peak = Math.max(peak, active);
    await sleep(15);
    active--;
  });
  assert.equal(peak, 2);
  await limiter.stop({ dropWaitingJobs: false });
});

test("minTime spaces job starts", async () => {
  const limiter = createLimiter({ maxConcurrent: 5, minTime: 40 });
  const starts: number[] = [];
  await callAll(limiter, ["a", "b", "c"], async () => { starts.push(Date.now()); });
  for (let i = 1; i < starts.length; i++) assert.ok(starts[i] - starts[i - 1] >= 30, `gap ${starts[i] - starts[i - 1]}ms`);
  await limiter.stop({ dropWaitingJobs: false });
});

test("higher priority (lower number) runs first", async () => {
  const limiter = createLimiter({ maxConcurrent: 1 });
  const order: string[] = [];
  const blocker = limiter.schedule(() => sleep(20));
  const jobs = [
    limiter.schedule({ priority: 9 }, async () => { order.push("low"); }),
    limiter.schedule({ priority: 1 }, async () => { order.push("high"); }),
    limiter.schedule({ priority: 5 }, async () => { order.push("mid"); }),
  ];
  await Promise.all([blocker, ...jobs]);
  assert.deepEqual(order, ["high", "mid", "low"]);
  await limiter.stop({ dropWaitingJobs: false });
});

test("retries 429 responses then succeeds; other errors fail fast", async () => {
  const limiter = createLimiter({ retries: 3, retryDelay: 5 });
  let calls = 0;
  const value = await limiter.schedule(async () => {
    calls++;
    if (calls < 3) throw Object.assign(new Error("slow down"), { status: 429 });
    return "ok";
  });
  assert.equal(value, "ok");
  assert.equal(calls, 3);
  await assert.rejects(limiter.schedule(async () => { throw Object.assign(new Error("bad"), { status: 500 }); }), /bad/);
  assert.deepEqual(limiter.counts(), { RECEIVED: 0, QUEUED: 0, RUNNING: 0, EXECUTING: 0 });
  await limiter.stop({ dropWaitingJobs: false });
});
