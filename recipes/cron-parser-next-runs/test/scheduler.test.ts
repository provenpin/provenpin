import { test } from "node:test";
import assert from "node:assert/strict";
import { nextRun, previousRun, nextRuns } from "../src/scheduler.ts";

const currentDate = new Date("2024-01-01T00:07:30.000Z");

test("computes the next and previous run dates", () => {
  assert.equal(
    nextRun("*/15 * * * *", { currentDate, tz: "UTC" }).toISOString(),
    "2024-01-01T00:15:00.000Z",
  );
  assert.equal(
    previousRun("*/15 * * * *", { currentDate, tz: "UTC" }).toISOString(),
    "2024-01-01T00:00:00.000Z",
  );
});

test("iterates upcoming runs with take", () => {
  const dates = nextRuns("*/15 * * * *", 3, { currentDate, tz: "UTC" });
  assert.deepEqual(
    dates.map((d) => d.toISOString()),
    [
      "2024-01-01T00:15:00.000Z",
      "2024-01-01T00:30:00.000Z",
      "2024-01-01T00:45:00.000Z",
    ],
  );
});

test("honours the tz option when resolving a daily schedule", () => {
  const next = nextRun("0 9 * * *", { currentDate, tz: "America/New_York" });
  assert.equal(next.toISOString(), "2024-01-01T14:00:00.000Z");
});

test("rejects an invalid cron expression", () => {
  assert.throws(() => nextRun("61 * * * *", { currentDate, tz: "UTC" }), Error);
});
