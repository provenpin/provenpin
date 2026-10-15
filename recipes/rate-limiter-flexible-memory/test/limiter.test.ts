import { test } from "node:test";
import assert from "node:assert/strict";
import { RateLimiterMemory } from "rate-limiter-flexible";
import {
  createLimiter,
  isRateLimiterRes,
  penalize,
  rewardPoints,
  tryConsume,
} from "../src/limiter.ts";

test("consume decrements remaining points", async () => {
  const limiter = createLimiter({ points: 3, duration: 60 });
  const first = await tryConsume(limiter, "user-1");
  assert.equal(first.allowed, true);
  assert.equal(first.remainingPoints, 2);
  const second = await tryConsume(limiter, "user-1");
  assert.equal(second.allowed, true);
  assert.equal(second.remainingPoints, 1);
});

test("rejection exposes msBeforeNext and remainingPoints", async () => {
  const limiter = createLimiter({ points: 2, duration: 60 });
  await tryConsume(limiter, "user-2");
  await tryConsume(limiter, "user-2");
  const rejected = await tryConsume(limiter, "user-2");
  assert.equal(rejected.allowed, false);
  assert.equal(rejected.remainingPoints, 0);
  assert.ok(rejected.msBeforeNext > 0);
});

test("isRateLimiterRes distinguishes rejections from plain errors", async () => {
  const limiter = createLimiter({ points: 1, duration: 60 });
  await limiter.consume("user-x");
  let caught: unknown;
  try {
    await limiter.consume("user-x");
  } catch (error) {
    caught = error;
  }
  assert.equal(isRateLimiterRes(caught), true);
  assert.equal(isRateLimiterRes(new Error("nope")), false);
});

test("blockDuration extends msBeforeNext once exhausted", async () => {
  const limiter = createLimiter({ points: 1, duration: 1, blockDuration: 60 });
  await tryConsume(limiter, "user-3");
  const rejected = await tryConsume(limiter, "user-3");
  assert.equal(rejected.allowed, false);
  assert.ok(
    rejected.msBeforeNext > 50_000,
    `expected block duration, received ${rejected.msBeforeNext}`,
  );
});

test("penalty consumes more points than a normal consume allows", async () => {
  const limiter = new RateLimiterMemory({ points: 5, duration: 60 });
  const penaltyResult = await penalize(limiter, "user-4", 5);
  assert.equal(penaltyResult.consumedPoints, 5);
  assert.equal(penaltyResult.remainingPoints, 0);
  const after = await tryConsume(limiter, "user-4");
  assert.equal(after.allowed, false);
});

test("reward restores consumed points", async () => {
  const limiter = createLimiter({ points: 3, duration: 60 });
  await tryConsume(limiter, "user-5");
  await tryConsume(limiter, "user-5");
  const remaining = await rewardPoints(limiter, "user-5", 2);
  assert.equal(remaining, 3);
});
