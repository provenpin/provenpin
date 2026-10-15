import type { RateLimiterMemory } from "rate-limiter-flexible";
import { isRateLimiterRes } from "./limiter.ts";

export type RateLimitRequest = {
  ip?: string;
  socket?: { remoteAddress?: string };
};

export type RateLimitResponse = {
  statusCode?: number;
  body?: unknown;
  setHeader?: (name: string, value: string | number) => void;
  status?: (code: number) => unknown;
  json?: (payload: unknown) => unknown;
};

export function defaultKeyGenerator(req: RateLimitRequest): string {
  return req.ip ?? req.socket?.remoteAddress ?? "unknown";
}

export function rateLimitMiddleware(
  limiter: RateLimiterMemory,
  options: {
    points?: number;
    keyGenerator?: (req: RateLimitRequest) => string;
  } = {},
) {
  const points = options.points ?? 1;
  const getKey = options.keyGenerator ?? defaultKeyGenerator;

  return async function middleware(
    req: RateLimitRequest,
    res: RateLimitResponse,
    next?: () => void,
  ): Promise<void> {
    const key = getKey(req);
    try {
      const result = await limiter.consume(key, points);
      res.setHeader?.("X-RateLimit-Remaining", result.remainingPoints);
      res.setHeader?.("Retry-After", Math.ceil(result.msBeforeNext / 1000));
      next?.();
    } catch (error) {
      if (!isRateLimiterRes(error)) throw error;
      const retryAfter = Math.ceil(error.msBeforeNext / 1000);
      res.setHeader?.("Retry-After", retryAfter);
      res.statusCode = 429;
      res.status?.(429);
      const payload = { error: "Too Many Requests", retryAfter };
      if (typeof res.json === "function") {
        res.json(payload);
      } else {
        res.body = payload;
      }
    }
  };
}
