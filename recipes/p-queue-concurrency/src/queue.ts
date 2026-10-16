import PQueue from "p-queue";

export type AsyncJob<T> = () => Promise<T>;

export interface TrackedQueue {
  queue: PQueue;
  run<T>(job: AsyncJob<T>): Promise<T>;
  readonly active: number;
  readonly maxActive: number;
}

export function createTrackedQueue(concurrency = 2): TrackedQueue {
  const queue = new PQueue({ concurrency });
  let active = 0;
  let maxActive = 0;

  async function run<T>(job: AsyncJob<T>): Promise<T> {
    const value = await queue.add(async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      try {
        return await job();
      } finally {
        active -= 1;
      }
    });
    return value as T;
  }

  return {
    queue,
    run,
    get active() {
      return active;
    },
    get maxActive() {
      return maxActive;
    },
  };
}
