import { test } from "node:test";
import assert from "node:assert/strict";
import { createJobQueue } from "../src/jobs.ts";

test("runs higher priority jobs first when concurrency is 1", async () => {
  const q = createJobQueue(1);
  q.pause();
  const low = q.add({
    id: "low",
    priority: 1,
    work: async () => {
      await new Promise((r) => setTimeout(r, 5));
      return "low";
    },
  });
  const high = q.add({
    id: "high",
    priority: 10,
    work: async () => "high",
  });
  q.start();
  await Promise.all([low, high]);
  await q.onIdle();
  assert.deepEqual(q.results(), ["high", "low"]);
});

test("respects concurrency", async () => {
  const q = createJobQueue(2);
  let active = 0;
  let peak = 0;
  const mk = (id: string) =>
    q.add({
      id,
      work: async () => {
        active++;
        peak = Math.max(peak, active);
        await new Promise((r) => setTimeout(r, 25));
        active--;
        return id;
      },
    });
  await Promise.all([mk("a"), mk("b"), mk("c")]);
  assert.ok(peak <= 2);
  assert.equal(q.results().length, 3);
});
