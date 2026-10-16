import { test } from "node:test";
import assert from "node:assert/strict";
import {
  errorLabel,
  nestedAccent,
  successBadge,
  statusLine,
  stripAnsi,
  hasAnsi,
} from "../src/styles.ts";

test("nested modifiers emit bold, red and blue-background escapes", () => {
  const output = errorLabel("boom", 1);
  assert.ok(hasAnsi(output));
  assert.equal(stripAnsi(output), "boom");
  assert.match(output, /\u001B\[1m/);
  assert.match(output, /\u001B\[31m/);
  assert.match(output, /\u001B\[44m/);
});

test("level 0 disables styling so non-TTY output is deterministic", () => {
  const styled = errorLabel("boom", 1);
  const plain = errorLabel("boom", 0);
  assert.notEqual(styled, plain);
  assert.equal(plain, "boom");
  assert.equal(hasAnsi(plain), false);
});

test("nested styles keep inner escapes and outer emphasis", () => {
  const output = nestedAccent("warn", 1);
  assert.equal(stripAnsi(output), "bold warn tail");
  assert.match(output, /\u001B\[4m/);
  assert.match(output, /\u001B\[31m/);
});

test("status line combines bold red and blue background", () => {
  const output = statusLine("ERROR", "request failed", 1);
  assert.equal(stripAnsi(output), "ERROR request failed");
  assert.ok(hasAnsi(output));
  assert.match(output, /\u001B\[44m/);
});

test("success badge combines background and foreground", () => {
  const output = successBadge("OK", "200", 1);
  assert.equal(stripAnsi(output), " OK  200");
  assert.match(output, /\u001B\[44m/);
  assert.match(output, /\u001B\[37m/);
  assert.match(output, /\u001B\[32m/);
});
