import { RateLimiterMemory, type RateLimiterRes } from "rate-limiter-flexible";

export type LimiterOptions = {
  points: number;
  duration: number;
  blockDuration?: number;
};

export type ConsumeResult = {
  allowed: boolean;
  remainingPoints: number;
  msBeforeNext: number;
};

export function createLimiter(options: LimiterOptions): RateLimiterMemory {
  return new RateLimiterMemory(options);
}

export function isRateLimiterRes(value: unknown): value is RateLimiterRes {
  return (
    typeof value === "object" &&
    value !== null &&
    "msBeforeNext" in value &&
    "remainingPoints" in value &&
    typeof (value as RateLimiterRes).msBeforeNext === "number" &&
    typeof (value as RateLimiterRes).remainingPoints === "number"
  );
}

export async function tryConsume(
  limiter: RateLimiterMemory,
  key: string,
  points = 1,
): Promise<ConsumeResult> {
  try {
    const result = await limiter.consume(key, points);
    return {
      allowed: true,
      remainingPoints: result.remainingPoints,
      msBeforeNext: result.msBeforeNext,
    };
  } catch (error) {
    if (!isRateLimiterRes(error)) throw error;
    return {
      allowed: false,
      remainingPoints: error.remainingPoints,
      msBeforeNext: error.msBeforeNext,
    };
  }
}

export async function penalize(
  limiter: RateLimiterMemory,
  key: string,
  points = 1,
): Promise<RateLimiterRes> {
  return limiter.penalty(key, points);
}

export async function rewardPoints(
  limiter: RateLimiterMemory,
  key: string,
  points = 1,
): Promise<number> {
  const result = await limiter.reward(key, points);
  return result.remainingPoints;
}
