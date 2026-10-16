import pTimeout, { TimeoutError } from "p-timeout";

export { TimeoutError };

export type TimeoutOptions = {
  milliseconds: number;
  message?: string | Error;
};

export function withTimeout<T>(
  promise: Promise<T>,
  options: TimeoutOptions,
): Promise<T> {
  return pTimeout(promise, {
    milliseconds: options.milliseconds,
    message: options.message ?? "Operation timed out",
  });
}

export function withTimeoutFallback<T>(
  promise: Promise<T>,
  milliseconds: number,
  fallback: () => T | Promise<T>,
): Promise<T> {
  return pTimeout(promise, { milliseconds, fallback });
}
