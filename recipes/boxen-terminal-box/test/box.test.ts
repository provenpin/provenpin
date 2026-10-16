import { test } from "node:test";
import assert from "node:assert/strict";
import { renderTerminalBox } from "../src/box.ts";

const stripAnsi = (value: string) => value.replace(/\u001B\[[0-9;]*m/g, "");

test("wraps text with box drawing characters", () => {
  const output = stripAnsi(renderTerminalBox("hello world"));
  assert.ok(output.includes("hello world"));
  assert.ok(output.includes("╭"));
  assert.ok(output.includes("╮"));
  assert.ok(output.includes("╰"));
  assert.ok(output.includes("╯"));
  assert.ok(output.includes("─"));
  assert.ok(output.includes("│"));
});

test("includes the configured title and dimmed border", () => {
  const output = stripAnsi(renderTerminalBox("deploy", { title: "build", dimBorder: true }));
  assert.ok(output.includes("build"));
  assert.ok(output.includes("deploy"));
});

test("forces the box to a fixed width", () => {
  const output = stripAnsi(renderTerminalBox("hi", { width: 24, margin: 0 }));
  const lines = output.split("\n").filter((line) => line.length > 0);
  assert.ok(lines.length >= 3);
  for (const line of lines) {
    assert.equal([...line].length, 24, "unexpected width for line: " + JSON.stringify(line));
  }
});
