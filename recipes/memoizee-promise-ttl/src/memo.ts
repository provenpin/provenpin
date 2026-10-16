import memoize from "memoizee";

export type MemoizedFn<F extends (...args: any[]) => any> = F & {
  clear(): void;
  delete(...args: Parameters<F>): boolean;
};

export interface MemoizeOptions {
  maxAge?: number;
}

export function memoizeSync<F extends (...args: any[]) => any>(
  fn: F,
  options: MemoizeOptions = {},
): MemoizedFn<F> {
  return memoize(fn, options) as unknown as MemoizedFn<F>;
}

export function memoizeAsync<F extends (...args: any[]) => any>(
  fn: F,
  options: MemoizeOptions = {},
): MemoizedFn<F> {
  return memoize(fn, { ...options, promise: true }) as unknown as MemoizedFn<F>;
}
