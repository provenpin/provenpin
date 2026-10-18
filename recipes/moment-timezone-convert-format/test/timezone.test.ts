import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseLocal,
  fromUtcInstant,
  toZone,
  formatWithZoneAbbrev,
  utcIso,
  businessInterval,
  overlapHours,
} from "../src/timezone.ts";

test("converts a New York morning to Tokyo and UTC with abbreviations", () => {
  const ny = parseLocal("2024-07-01 09:00", "America/New_York");
  assert.equal(formatWithZoneAbbrev(ny, "America/New_York"), "2024-07-01 09:00 EDT");
  assert.equal(formatWithZoneAbbrev(ny, "Asia/Tokyo"), "2024-07-01 22:00 JST");
  assert.equal(formatWithZoneAbbrev(ny, "UTC"), "2024-07-01 13:00 UTC");
  assert.equal(utcIso(ny), "2024-07-01T13:00:00.000Z");
});

test("spring forward gap normalizes 02:30 to 03:30 EDT", () => {
  const gap = parseLocal("2024-03-10 02:30", "America/New_York");
  assert.equal(formatWithZoneAbbrev(gap, "America/New_York"), "2024-03-10 03:30 EDT");
  assert.equal(formatWithZoneAbbrev(gap, "Asia/Tokyo"), "2024-03-10 16:30 JST");
  assert.equal(utcIso(gap), "2024-03-10T07:30:00.000Z");
});

test("fall back overlap maps two UTC instants to 01:30 local", () => {
  const first = parseLocal("2024-11-03 01:30", "America/New_York");
  assert.equal(formatWithZoneAbbrev(first, "America/New_York"), "2024-11-03 01:30 EDT");
  assert.equal(utcIso(first), "2024-11-03T05:30:00.000Z");

  const second = toZone(fromUtcInstant("2024-11-03T06:30:00.000Z"), "America/New_York");
  assert.equal(formatWithZoneAbbrev(second, "America/New_York"), "2024-11-03 01:30 EST");
  assert.notEqual(utcIso(first), utcIso(second));
});

test("computes business hour overlap between zones", () => {
  const ny = businessInterval("2024-07-01", "America/New_York", 9, 17);
  const london = businessInterval("2024-07-01", "Europe/London", 9, 17);
  const tokyo = businessInterval("2024-07-01", "Asia/Tokyo", 9, 17);

  assert.equal(overlapHours(ny, london), 3);
  assert.equal(overlapHours(ny, tokyo), 0);
});
