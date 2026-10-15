import CircuitBreaker from "opossum";

export type Fetcher = (id: string) => Promise<{ id: string; price: number }>;

export function createPriceBreaker(fetcher: Fetcher, opts: { resetTimeout?: number; timeout?: number } = {}) {
  const breaker = new CircuitBreaker(fetcher, {
    timeout: opts.timeout ?? 100,
    errorThresholdPercentage: 50,
    volumeThreshold: 2,
    resetTimeout: opts.resetTimeout ?? 50,
  });
  const events: string[] = [];
  for (const ev of ["open", "halfOpen", "close"] as const) breaker.on(ev, () => events.push(ev));
  breaker.fallback((id: string) => ({ id, price: -1, cached: true }));
  return { breaker, events };
}
