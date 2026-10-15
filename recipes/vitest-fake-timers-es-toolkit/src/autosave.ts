import { debounce, throttle, retry, delay } from "es-toolkit";

/** Saves at most once per pause in typing; flush() forces a save, cancel() drops it. */
export function createAutosave(save: (text: string) => void, wait = 500) {
  const run = debounce((text: string) => save(text), wait);
  return { change: (text: string) => run(text), flush: () => run.flush(), cancel: () => run.cancel() };
}

export function createScrollTracker(report: (y: number) => void, every = 100) {
  return throttle((y: number) => report(y), every);
}

/** Retries a flaky call with a fixed delay between attempts. */
export function fetchWithRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000) {
  return retry(fn, { retries, delay: delayMs });
}

export async function stamp(label: string, waitMs: number) {
  await delay(waitMs);
  return `${label} at ${new Date().toISOString()}`;
}
