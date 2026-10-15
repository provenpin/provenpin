import { test } from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { JobConfig, SchedulerConfig, previewRuns, startScheduler } from "../src/scheduler.ts";

test("validates names, patterns and timezones", () => {
  assert.equal(JobConfig.parse({ name: "nightly", schedule: "0 2 * * *" }).timezone, "UTC");
  const r = JobConfig.safeParse({ name: "Bad Name", schedule: "61 * * * *", timezone: "Mars/Olympus" });
  assert.equal(r.success, false);
  assert.deepEqual(r.error!.issues.map((i) => i.path[0]).sort(), ["name", "schedule", "timezone"]);
});

test("rejects duplicate job names", () => {
  assert.throws(() => SchedulerConfig.parse({ jobs: [{ name: "a", schedule: "* * * * *" }, { name: "a", schedule: "0 * * * *" }] }), ZodError);
});

test("previews runs in a timezone across a DST change", () => {
  // 09:00 every day in New York; DST ends 2026-11-01 so the UTC hour shifts from 13 to 14.
  const job = JobConfig.parse({ name: "standup", schedule: "0 9 * * *", timezone: "America/New_York" });
  assert.deepEqual(previewRuns(job, 3, new Date("2026-10-31T00:00:00Z")), [
    "2026-10-31T13:00:00.000Z",
    "2026-11-01T14:00:00.000Z",
    "2026-11-02T14:00:00.000Z",
  ]);
});

test("supports last-day-of-month and weekday ranges", () => {
  const eom = JobConfig.parse({ name: "invoice", schedule: "0 0 L * *" });
  assert.deepEqual(previewRuns(eom, 2, new Date("2027-02-10T00:00:00Z")), ["2027-02-28T00:00:00.000Z", "2027-03-31T00:00:00.000Z"]);
  const weekdays = JobConfig.parse({ name: "report", schedule: "30 8 * * MON-FRI" });
  // 2026-10-16 is a Friday, so the next weekday run after it is Monday 19th.
  assert.deepEqual(previewRuns(weekdays, 2, new Date("2026-10-16T09:00:00Z")), ["2026-10-19T08:30:00.000Z", "2026-10-20T08:30:00.000Z"]);
});

test("runs a per-second job for maxRuns and then stops", async () => {
  let calls = 0;
  const s = startScheduler({ jobs: [{ name: "tick", schedule: "* * * * * *", maxRuns: 2 }] }, { tick: () => { calls++; } });
  await new Promise((r) => setTimeout(r, 2600));
  assert.equal(calls, 2);
  assert.equal(s.jobs[0].nextRun(), null);
  s.stopAll();
});

test("refuses to start when a handler is missing", () => {
  assert.throws(() => startScheduler({ jobs: [{ name: "orphan", schedule: "* * * * *" }] }, {}), /no handler for: orphan/);
});
