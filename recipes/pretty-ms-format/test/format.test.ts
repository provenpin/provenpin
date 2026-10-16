import { test } from "node:test";
import assert from "node:assert/strict";
import prettyMilliseconds from "pretty-ms";
import { formatDuration, formatPrecise } from "../src/format.ts";

test("formats zero, sub-second and negative durations", () => {
  assert.equal(formatDuration(0), "0ms");
  assert.equal(formatDuration(500), "500ms");
  assert.equal(formatDuration(1500), "1.5s");
  assert.equal(formatDuration(-1500), "-1.5s");
});

test("formats multi-hour durations", () => {
  assert.equal(formatDuration(3600000), "1h");
  assert.equal(formatDuration(1337000000), "15d 11h 23m 20s");
});

test("supports compact and verbose styles", () => {
  assert.equal(formatDuration(1337000000, "compact"), "15d");
  assert.equal(
    formatDuration(1337000000, "verbose"),
    "15 days 11 hours 23 minutes 20 seconds",
  );
});

test("supports colon notation", () => {
  assert.equal(formatDuration(1000, "clock"), "0:01");
  assert.equal(formatDuration(60000, "clock"), "1:00");
  assert.equal(formatDuration(3600000, "clock"), "1:00:00");
});

test("supports separate milliseconds and precision options", () => {
  assert.equal(
    prettyMilliseconds(1234, { separateMilliseconds: true }),
    "1s 234ms",
  );
  assert.equal(prettyMilliseconds(1234, { secondsDecimalDigits: 0 }), "1s");
  assert.match(formatPrecise(1234), /^1s 234(\.0+)?ms$/);
});
