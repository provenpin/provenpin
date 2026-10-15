import pLimit from "p-limit";

export async function mapLimited<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const limit = pLimit(concurrency);
  return Promise.all(items.map((item, i) => limit(() => fn(item, i))));
}

export function createPool(concurrency: number) {
  const limit = pLimit(concurrency);
  return {
    run<T>(fn: () => Promise<T>) {
      return limit(fn);
    },
    active() {
      return limit.activeCount;
    },
    pending() {
      return limit.pendingCount;
    },
  };
}
