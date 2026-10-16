import { test } from "node:test";
import assert from "node:assert/strict";
import { formatBytes } from "../src/format.ts";

test("formats zero and small byte counts", () => {
  assert.equal(formatBytes(0), "0 B");
  assert.equal(formatBytes(1), "1 B");
  assert.equal(formatBytes(100), "100 B");
  assert.equal(formatBytes(999), "999 B");
});

test("formats decimal kB, MB and GB boundaries", () => {
  assert.equal(formatBytes(1000), "1 kB");
  assert.equal(formatBytes(1024), "1.02 kB");
  assert.equal(formatBytes(1_000_000), "1 MB");
  assert.equal(formatBytes(1_000_000_000), "1 GB");
});

test("formats negative byte counts", () => {
  assert.equal(formatBytes(-500), "-500 B");
  assert.equal(formatBytes(-1000), "-1 kB");
  assert.equal(formatBytes(-1024), "-1.02 kB");
});

test("formats bits when requested", () => {
  assert.equal(formatBytes(1000, { bits: true }), "1 kbit");
  assert.equal(formatBytes(1024, { bits: true }), "1.02 kbit");
});

test("formats binary units when requested", () => {
  assert.equal(formatBytes(1024, { binary: true }), "1 KiB");
  assert.equal(formatBytes(2048, { binary: true }), "2 KiB");
  assert.equal(formatBytes(1024 * 1024, { binary: true }), "1 MiB");
});

test("adds a sign for positive and negative values", () => {
  assert.equal(formatBytes(1234, { signed: true }), "+1.23 kB");
  assert.equal(formatBytes(-1234, { signed: true }), "-1.23 kB");
});

test("honours minimumFractionDigits", () => {
  assert.equal(formatBytes(1000, { minimumFractionDigits: 2 }), "1.00 kB");
  assert.equal(formatBytes(1500, { minimumFractionDigits: 2 }), "1.50 kB");
});

test("rejects non-finite input", () => {
  assert.throws(() => formatBytes(Number.POSITIVE_INFINITY), TypeError);
});
