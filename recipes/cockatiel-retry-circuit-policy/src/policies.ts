import {
  retry, circuitBreaker, timeout, wrap, handleAll, handleWhen, ConstantBackoff, ConsecutiveBreaker,
  TimeoutStrategy, CircuitState,
} from "cockatiel";

export class HttpError extends Error {
  constructor(public status: number) { super(`HTTP ${status}`); }
}

const transient = handleWhen((e) => e instanceof HttpError && e.status >= 500);

export function createPolicies(opts: { attempts?: number; breakAfter?: number; halfOpenAfter?: number; timeoutMs?: number } = {}) {
  const retryPolicy = retry(transient, { maxAttempts: opts.attempts ?? 2, backoff: new ConstantBackoff(1) });
  const breaker = circuitBreaker(handleAll, {
    halfOpenAfter: opts.halfOpenAfter ?? 50,
    breaker: new ConsecutiveBreaker(opts.breakAfter ?? 3),
  });
  const timeoutPolicy = timeout(opts.timeoutMs ?? 100, TimeoutStrategy.Aggressive);
  const log: string[] = [];
  retryPolicy.onRetry(({ attempt }) => log.push(`retry ${attempt}`));
  breaker.onBreak(() => log.push("break"));
  breaker.onReset(() => log.push("reset"));
  // Outermost first: retry wraps the breaker, which wraps the per-attempt timeout.
  const policy = wrap(retryPolicy, breaker, timeoutPolicy);
  return { policy, breaker, retryPolicy, log, CircuitState };
}
