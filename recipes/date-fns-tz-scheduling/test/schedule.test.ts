import { test } from "node:test";
import assert from "node:assert/strict";
import { dailyAt, formatIn, hoursBetweenMidnights, startOfDayIn } from "../src/schedule.ts";

test("9am New York stays 9am across the November DST change", () => {
  assert.deepEqual(dailyAt("America/New_York", "2026-10-31T12:00:00Z", 9, 3), [
    "2026-10-31T13:00:00.000Z", // EDT (UTC-4)
    "2026-11-01T14:00:00.000Z", // EST (UTC-5)
    "2026-11-02T14:00:00.000Z",
  ]);
});

test("format in a zone", () => {
  assert.equal(formatIn("2026-07-01T12:00:00Z", "Asia/Tokyo"), "2026-07-01 21:00");
});

test("start of day for a user zone as UTC", () => {
  assert.equal(startOfDayIn("2026-10-15T05:00:00Z", "America/Anchorage"), "2026-10-14T08:00:00.000Z");
});

test("DST days are 23 or 25 hours long", () => {
  assert.equal(hoursBetweenMidnights("America/New_York", "2026-03-08T12:00:00Z"), 23);
  assert.equal(hoursBetweenMidnights("America/New_York", "2026-11-01T12:00:00Z"), 25);
});
