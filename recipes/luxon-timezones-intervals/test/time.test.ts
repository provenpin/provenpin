import { test } from "node:test";
import assert from "node:assert/strict";
import { DateTime } from "luxon";
import { addMonthsEndClamped, humanDuration, isBusinessHours, meetingsOverlap, toZone } from "../src/time.ts";

test("zone conversion keeps the instant", () => {
  const t = toZone("2026-07-01T12:00:00Z", "Europe/Paris");
  assert.equal(t.toFormat("HH:mm"), "14:00");
  assert.equal(t.offset, 120);
  assert.equal(t.toUTC().toISO(), "2026-07-01T12:00:00.000Z");
});

test("business hours in the caller's zone", () => {
  assert.equal(isBusinessHours("2026-10-15T17:00:00Z", "America/Anchorage"), true);  // 09:00 AKDT Thu
  assert.equal(isBusinessHours("2026-10-17T20:00:00Z", "America/Anchorage"), false); // Saturday
});

test("interval overlap", () => {
  assert.equal(meetingsOverlap(["2026-01-01T10:00Z", "2026-01-01T11:00Z"], ["2026-01-01T10:30Z", "2026-01-01T12:00Z"]), true);
  assert.equal(meetingsOverlap(["2026-01-01T10:00Z", "2026-01-01T11:00Z"], ["2026-01-01T11:00Z", "2026-01-01T12:00Z"]), false);
});

test("month math clamps to month end; durations read well", () => {
  assert.equal(addMonthsEndClamped("2026-01-31", 1), "2026-02-28");
  assert.match(humanDuration(5_400_000), /1 hr, 30 min/);
});

test("invalid input throws", () => {
  assert.throws(() => DateTime.fromISO("2026-13-45"));
});
