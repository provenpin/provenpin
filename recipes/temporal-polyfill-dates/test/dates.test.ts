import { test } from "node:test";
import assert from "node:assert/strict";
import { addBusinessDays, daysBetween, monthEnd } from "../src/dates.ts";

test("skips weekends when adding business days", () => {
  // 2026-10-15 is Thursday
  assert.equal(addBusinessDays("2026-10-15", 1), "2026-10-16");
  assert.equal(addBusinessDays("2026-10-15", 3), "2026-10-20");
});

test("daysBetween and monthEnd", () => {
  assert.equal(daysBetween("2026-10-01", "2026-10-15"), 14);
  assert.equal(monthEnd("2026-02-10"), "2026-02-28");
});
