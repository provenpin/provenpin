import PQueue from "p-queue";

export type Job = { id: string; priority?: number; work: () => Promise<string> };

export function createJobQueue(concurrency = 2) {
  const queue = new PQueue({ concurrency });
  const results: string[] = [];

  return {
    add(job: Job) {
      return queue.add(
        async () => {
          const value = await job.work();
          results.push(value);
          return value;
        },
        { priority: job.priority ?? 0 },
      );
    },
    pause() {
      queue.pause();
    },
    start() {
      queue.start();
    },
    async onIdle() {
      await queue.onIdle();
    },
    size() {
      return queue.size;
    },
    results() {
      return [...results];
    },
  };
}
