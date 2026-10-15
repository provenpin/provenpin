import { test } from "node:test";
import assert from "node:assert/strict";
import { RRule, weekly, occurrences, between, describe, serialize, parse, lastWeekdayOfMonth } from "../src/schedule.ts";

test("9am Anchorage stays 9am across the Nov 1 DST change", () => {
  const rule = weekly("2026-10-26T09:00", "America/Anchorage", [RRule.MO.weekday], 3);
  assert.deepEqual(occurrences(rule, "America/Anchorage"), [
    "2026-10-26T09:00:00-08:00",
    "2026-11-02T09:00:00-09:00",
    "2026-11-09T09:00:00-09:00",
  ]);
});

test("same rule as UTC instants shifts by an hour after DST ends", () => {
  const rule = weekly("2026-10-26T09:00", "America/Anchorage", [RRule.MO.weekday], 10);
  assert.deepEqual(between(rule, "America/Anchorage", "2026-10-25T00:00", "2026-11-03T00:00"), [
    "2026-10-26T17:00:00Z",
    "2026-11-02T18:00:00Z",
  ]);
});

test("multi-day rule in another zone", () => {
  const rule = weekly("2027-03-08T18:30", "Europe/London", [RRule.MO.weekday, RRule.WE.weekday], 4);
  assert.deepEqual(occurrences(rule, "Europe/London"), [
    "2027-03-08T18:30:00+00:00",
    "2027-03-10T18:30:00+00:00",
    "2027-03-15T18:30:00+00:00",
    "2027-03-17T18:30:00+00:00",
  ]);
});

test("human text and RFC 5545 string round trip", () => {
  const rule = weekly("2026-10-26T09:00", "America/Anchorage", [RRule.MO.weekday, RRule.TH.weekday], 6);
  assert.equal(describe(rule), "every week on Monday, Thursday for 6 times");
  const s = serialize(rule);
  assert.match(s, /RRULE:FREQ=WEEKLY;BYDAY=MO,TH;COUNT=6/);
  assert.deepEqual(parse(s).all(), rule.all());
});

test("last weekday of month with BYSETPOS", () => {
  assert.deepEqual(lastWeekdayOfMonth(2026, 4), ["2026-01-30", "2026-02-27", "2026-03-31", "2026-04-30"]);
});
