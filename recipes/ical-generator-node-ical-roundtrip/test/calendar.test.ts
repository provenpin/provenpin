import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCalendar, parseCalendar } from "../src/calendar.ts";

const sessions = [
  { id: "cits-1", title: "CITS Orientation, Day 1", start: new Date("2026-11-01T17:00:00Z"), end: new Date("2026-11-02T01:00:00Z"), location: "Kenai, AK" },
  { id: "rig-1", title: "Rigging; slings, hitches", start: new Date("2026-11-05T17:00:00Z"), end: new Date("2026-11-05T21:00:00Z"), location: "Shop 2" },
];

test("generates valid iCalendar text", () => {
  const ics = buildCalendar(sessions);
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /PRODID:-\/\/provenpin\/\/recipes\/\/EN/);
  assert.match(ics, /SUMMARY:Rigging\\; slings\\, hitches/); // RFC 5545 escaping
  assert.match(ics, /RRULE:FREQ=WEEKLY;COUNT=4/);
  assert.ok(ics.trimEnd().endsWith("END:VCALENDAR"));
});

test("round trips through node-ical", () => {
  const events = parseCalendar(buildCalendar(sessions));
  const byId = Object.fromEntries(events.map((e) => [e.uid, e]));
  assert.deepEqual(Object.keys(byId).sort(), ["cits-1", "office-hours", "rig-1"]);
  assert.equal(byId["rig-1"].summary, "Rigging; slings, hitches");
  assert.equal(byId["cits-1"].start, "2026-11-01T17:00:00.000Z");
  assert.equal(byId["cits-1"].end, "2026-11-02T01:00:00.000Z");
  assert.equal(byId["cits-1"].location, "Kenai, AK");
});

test("recurrence rule and exception dates survive", () => {
  const oh = parseCalendar(buildCalendar(sessions)).find((e) => e.uid === "office-hours")!;
  assert.match(oh.rrule!, /FREQ=WEEKLY;COUNT=4/);
  assert.deepEqual(oh.exdates, ["2026-11-16T18:00:00.000Z"]);
  const active = oh.occurrences.filter((d) => !oh.exdates.includes(d));
  assert.deepEqual(active, ["2026-11-02T18:00:00.000Z", "2026-11-09T18:00:00.000Z", "2026-11-23T18:00:00.000Z"]);
});
