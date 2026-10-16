import pDefer, { type DeferredPromise } from "p-defer";

export type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (error?: unknown) => void;
};

export function createDeferred<T>(): Deferred<T> {
  const deferred: DeferredPromise<T> = pDefer<T>();
  return deferred;
}

export function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === "object" || typeof value === "function") &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}
