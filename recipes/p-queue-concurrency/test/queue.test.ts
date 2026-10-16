import { test } from "node:test";
import assert from "node:assert/strict";
import PQueue from "p-queue";
import { createTrackedQueue } from "../src/queue.ts";

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

test("runs at most the configured concurrency", async () => {
  const tracked = createTrackedQueue(2);

  const jobs = Array.from({ length: 6 }, (_, i) =>
    tracked.run(async () => {
      await delay(10);
      return i;
    })
  );

  const results = await Promise.all(jobs);
  await tracked.queue.onIdle();

  assert.deepEqual(results, [0, 1, 2, 3, 4, 5]);
  assert.equal(tracked.maxActive, 2);
});

test("pause holds jobs until start", async () => {
  const queue = new PQueue({ concurrency: 2 });
  const started: number[] = [];
  queue.pause();

  const jobs = [1, 2, 3].map((n) =>
    queue.add(async () => {
      started.push(n);
      await delay(5);
    })
  );

  await delay(5);
  assert.deepEqual(started, []);

  queue.start();
  await queue.onIdle();
  await Promise.all(jobs);

  assert.deepEqual(started, [1, 2, 3]);
});

test("onIdle resolves once all jobs finish", async () => {
  const queue = new PQueue({ concurrency: 1 });
  let finished = 0;

  void queue.add(async () => {
    await delay(5);
    finished += 1;
  });
  void queue.add(async () => {
    await delay(5);
    finished += 1;
  });

  await queue.onIdle();

  assert.equal(finished, 2);
  assert.equal(queue.size, 0);
  assert.equal(queue.pending, 0);
});
