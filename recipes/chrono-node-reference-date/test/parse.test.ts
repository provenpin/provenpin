import { test } from "node:test";
import assert from "node:assert/strict";
import { parseWhen, parseOne, parseGB } from "../src/parse.ts";

// Thursday 2026-10-15 12:00 in Alaska (UTC-8) = 20:00Z
const ref = new Date("2026-10-15T20:00:00Z");
const AK = -480;

test("relative day and time in a fixed offset", () => {
  assert.equal(parseOne("tomorrow at 9am", ref, AK), "2026-10-16T17:00:00.000Z");
  assert.equal(parseOne("in 3 days", ref, AK), "2026-10-18T20:00:00.000Z");
});

test("weekday name with forwardDate picks the next one", () => {
  assert.equal(parseOne("monday 8:30", ref, AK), "2026-10-19T16:30:00.000Z");
});

test("ranges give start and end", () => {
  const [r] = parseWhen("Oct 20 2pm - 4pm", ref, AK);
  assert.equal(r.start, "2026-10-20T22:00:00.000Z");
  assert.equal(r.end, "2026-10-21T00:00:00.000Z");
});

test("finds dates inside a sentence with position and certainty", () => {
  const rs = parseWhen("Class moved to Nov 1st, signup closes Friday", ref, AK);
  assert.equal(rs.length, 2);
  assert.equal(rs[0].text, "Nov 1st");
  assert.equal(rs[0].index, 15);
  assert.equal(rs[0].certainHour, false);
  assert.equal(rs[1].text, "Friday");
});

test("UTC offset changes the instant", () => {
  assert.equal(parseOne("2026-11-01 10:00", ref, 0), "2026-11-01T10:00:00.000Z");
  assert.equal(parseOne("2026-11-01 10:00", ref, AK), "2026-11-01T18:00:00.000Z");
});

test("en.GB reads day before month", () => {
  assert.equal(parseGB("03/04/2027 noon", ref), "2027-04-03T12:00:00.000Z");
});

test("no date returns empty", () => {
  assert.deepEqual(parseWhen("bring your hard hat", ref, AK), []);
  assert.equal(parseOne("nothing here", ref, AK), null);
});
