import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCli } from "../src/argv.ts";

test("parses string and boolean options", () => {
  const parsed = parseCli(["--name", "alice", "--verbose"]);
  assert.equal(parsed.name, "alice");
  assert.equal(parsed.verbose, true);
});

test("honours aliases", () => {
  const parsed = parseCli(["-n", "bob", "-v"]);
  assert.equal(parsed.name, "bob");
  assert.equal(parsed.verbose, true);
});

test("applies defaults when flags are absent", () => {
  const parsed = parseCli([]);
  assert.equal(parsed.name, "world");
  assert.equal(parsed.verbose, false);
  assert.deepEqual(parsed._, []);
});

test("collects positional arguments into _", () => {
  const parsed = parseCli(["build", "--name", "app", "extra"]);
  assert.deepEqual(parsed._, ["build", "extra"]);
  assert.equal(parsed.name, "app");
});

test("separates arguments after -- when enabled", () => {
  const parsed = parseCli(["--name", "app", "--", "--not-a-flag", "file.txt"]);
  assert.equal(parsed.name, "app");
  assert.deepEqual(parsed["--"], ["--not-a-flag", "file.txt"]);
});

test("keeps unknown flags when not restricted", () => {
  const parsed = parseCli(["--mystery", "x", "--toggle"]);
  assert.equal(parsed.mystery, "x");
  assert.equal(parsed.toggle, true);
});
