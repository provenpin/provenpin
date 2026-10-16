import { test } from "node:test";
import assert from "node:assert/strict";
import { createColors } from "picocolors";
import { color, plain, status, badge } from "../src/colors.ts";

const ANSI = /\u001b\[[0-9;]*m/;

test("red and green helpers emit expected ANSI codes", () => {
  assert.equal(color.red("x"), "\u001b[31mx\u001b[39m");
  assert.equal(color.green("x"), "\u001b[32mx\u001b[39m");
  assert.match(color.red("fail"), ANSI);
  assert.match(color.green("ok"), ANSI);
});

test("bold and dim helpers emit expected ANSI codes", () => {
  assert.equal(color.bold("x"), "\u001b[1mx\u001b[22m");
  assert.equal(color.dim("x"), "\u001b[2mx\u001b[22m");
  assert.match(color.bold("x"), ANSI);
  assert.match(color.dim("x"), ANSI);
});

test("bgYellow helper emits expected background ANSI code", () => {
  const out = badge("note");
  assert.equal(out, "\u001b[43m\u001b[30mnote\u001b[39m\u001b[49m");
  assert.match(out, /\u001b\[43m/);
  assert.match(out, /\u001b\[30m/);
});

test("composed status line carries nested codes", () => {
  const ok = status(true, "build");
  assert.match(ok, /\u001b\[32m/);
  assert.match(ok, /\u001b\[1m/);
  assert.match(ok, /\u001b\[2m/);
  const bad = status(false, "build");
  assert.match(bad, /\u001b\[31m/);
});

test("coloring disabled yields plain output", () => {
  assert.equal(plain.isColorSupported, false);
  const off = createColors(false);
  assert.equal(off.isColorSupported, false);
  assert.equal(off.red("plain"), "plain");
  assert.equal(plain.bold(plain.green("plain")), "plain");
  assert.doesNotMatch(plain.red("plain"), ANSI);
});

test("coloring enabled reports support", () => {
  assert.equal(color.isColorSupported, true);
  assert.equal(createColors(true).isColorSupported, true);
});
