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
  // One call per event: on() has an overload per event name, so a union of names matches none.
  breaker.on("open", () => events.push("open"));
  breaker.on("halfOpen", () => events.push("halfOpen"));
  breaker.on("close", () => events.push("close"));
  breaker.fallback((id: string) => ({ id, price: -1, cached: true }));
  return { breaker, events };
}
