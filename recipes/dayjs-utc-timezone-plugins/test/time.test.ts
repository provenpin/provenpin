import { test } from "node:test";
import assert from "node:assert/strict";
import { describeFrom, parseLocal, shiftBusinessHours, toUtcIso } from "../src/time.ts";

test("converts Anchorage local time to UTC", () => {
  // 2026-01-15 12:00 AKST = UTC-9
  const iso = toUtcIso("2026-01-15 12:00", "America/Anchorage");
  assert.equal(iso, "2026-01-15T21:00:00.000Z");
  assert.equal(parseLocal("2026-01-15 12:00", "America/Anchorage").format("Z"), "-09:00");
});

test("duration add and relative time", () => {
  assert.equal(shiftBusinessHours("2026-01-15T21:00:00.000Z", 3), "2026-01-16T00:00:00.000Z");
  assert.equal(describeFrom("2026-01-15T21:00:00.000Z", "2026-01-15T23:00:00.000Z"), "2 hours");
});
