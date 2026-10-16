import { test } from "node:test";
import assert from "node:assert/strict";
import stringWidth from "string-width";
import stripAnsi from "strip-ansi";
import { RED, BOLD, RESET, visibleWidth, strip, colorize } from "../src/width.ts";

test("measures ASCII width as character count", () => {
  assert.equal(visibleWidth("hello"), 5);
  assert.equal(visibleWidth(""), 0);
});

test("measures CJK wide characters as two columns each", () => {
  assert.equal(visibleWidth("你好"), 4);
  assert.equal(visibleWidth("こんにちは"), 10);
});

test("measures emoji as two columns", () => {
  assert.equal(visibleWidth("👍"), 2);
  assert.equal(visibleWidth("a👍b"), 4);
});

test("ignores ANSI escape codes when measuring width", () => {
  const colored = colorize("hello", [RED]);
  assert.equal(visibleWidth(colored), 5);
  assert.equal(stringWidth(colored), 5);
});

test("strips ANSI codes to plain text", () => {
  const colored = colorize("hello", [BOLD, RED]);
  assert.equal(colored, `${BOLD}${RED}hello${RESET}`);
  assert.equal(strip(colored), "hello");
  assert.equal(stripAnsi(colored), "hello");
});

test("strip keeps wide characters and emoji intact", () => {
  const mixed = colorize("你好👍", [RED]);
  assert.equal(strip(mixed), "你好👍");
  assert.equal(visibleWidth(strip(mixed)), 6);
});
