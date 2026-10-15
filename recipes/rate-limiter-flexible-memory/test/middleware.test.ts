import { test } from "node:test";
import assert from "node:assert/strict";
import { RateLimiterMemory } from "rate-limiter-flexible";
import {
  rateLimitMiddleware,
  type RateLimitRequest,
  type RateLimitResponse,
} from "../src/middleware.ts";

function createRes(): RateLimitResponse & {
  headers: Record<string, string | number>;
} {
  const headers: Record<string, string | number> = {};
  return {
    headers,
    statusCode: undefined,
    body: undefined,
    setHeader(name: string, value: string | number) {
      headers[name] = value;
    },
  };
}

test("middleware calls next while under the limit", async () => {
  const limiter = new RateLimiterMemory({ points: 2, duration: 60 });
  const middleware = rateLimitMiddleware(limiter);
  const req: RateLimitRequest = { ip: "10.0.0.1" };
  const res = createRes();
  let nextCalls = 0;

  await middleware(req, res, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 1);
  assert.equal(res.statusCode, undefined);
  assert.equal(res.headers["X-RateLimit-Remaining"], 1);
});

test("middleware responds with 429 when the key is exhausted", async () => {
  const limiter = new RateLimiterMemory({ points: 1, duration: 60 });
  const middleware = rateLimitMiddleware(limiter);
  const req: RateLimitRequest = { socket: { remoteAddress: "10.0.0.2" } };
  const res = createRes();
  let nextCalls = 0;

  await middleware(req, res, () => {
    nextCalls += 1;
  });
  await middleware(req, res, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 1);
  assert.equal(res.statusCode, 429);
  assert.equal((res.body as { error: string }).error, "Too Many Requests");
  assert.ok(Number(res.headers["Retry-After"]) >= 1);
});
