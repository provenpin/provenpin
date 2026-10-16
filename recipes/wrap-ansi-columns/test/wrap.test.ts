import { test } from "node:test";
import assert from "node:assert/strict";
import { wrap, wrapLines, visibleWidth } from "../src/wrap.ts";

const SENTENCE = "The quick brown fox jumped over the lazy dog";

const stripAnsi = (value: string): string => value.replace(/\u001B\[[0-9;]*m/g, "");

test("wraps long text to a column width on word boundaries", () => {
  const output = wrap(SENTENCE, { columns: 20 });
  assert.equal(output, "The quick brown fox\njumped over the lazy\ndog");
  for (const line of wrapLines(SENTENCE, { columns: 20 })) {
    assert.ok(line.length <= 20, `line exceeds columns: ${line}`);
  }
});

test("hard wrap breaks words longer than the column width", () => {
  const output = wrap("abcdefghijklm", { columns: 5, hard: true });
  assert.equal(output, "abcde\nfghij\nklm");
  for (const line of wrapLines("abcdefghijklm", { columns: 5, hard: true })) {
    assert.ok(line.length <= 5, `line exceeds columns: ${line}`);
  }
});

test("soft wrap keeps long words intact", () => {
  const output = wrap("abcdefghijklm", { columns: 5 });
  assert.equal(output, "abcdefghijklm");
  assert.equal(visibleWidth(output), 13);
});

test("trim removes whitespace on wrapped line boundaries", () => {
  const trimmed = wrap(SENTENCE, { columns: 20, trim: true });
  const kept = wrap(SENTENCE, { columns: 20, trim: false });
  assert.equal(trimmed, "The quick brown fox\njumped over the lazy\ndog");
  assert.equal(kept, "The quick brown fox \njumped over the lazy\n dog");
  assert.notEqual(trimmed, kept);
});

test("preserves ANSI escape codes while wrapping", () => {
  const colored = "\u001B[31mThe quick brown fox\u001B[39m";
  const output = wrap(colored, { columns: 10 });
  const lines = output.split("\n");
  assert.deepEqual(lines.map(stripAnsi), ["The quick", "brown fox"]);
  assert.ok(output.includes("\u001B[31m"));
  assert.ok(output.includes("\u001B[39m"));
  for (const line of lines) {
    assert.ok(visibleWidth(line) <= 10, `visible line exceeds columns: ${line}`);
  }
});
