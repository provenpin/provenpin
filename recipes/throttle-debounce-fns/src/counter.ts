import { debounce, throttle } from "throttle-debounce";

export interface Counter {
  increment(): number;
  readonly value: number;
}

export function createCounter(): Counter {
  let count = 0;
  return {
    increment() {
      count += 1;
      return count;
    },
    get value() {
      return count;
    },
  };
}

export interface Cancelable {
  cancel(): void;
}

export type DebouncedIncrement = (() => void) & Cancelable;
export type ThrottledIncrement = (() => void) & Cancelable;

export function debouncedIncrement(
  delayMs: number,
  counter: Counter,
): DebouncedIncrement {
  return debounce(delayMs, () => {
    counter.increment();
  }) as DebouncedIncrement;
}

export function throttledIncrement(
  delayMs: number,
  counter: Counter,
): ThrottledIncrement {
  return throttle(delayMs, () => {
    counter.increment();
  }) as ThrottledIncrement;
}
