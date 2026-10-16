import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PATTERNS,
  createIgnoreFilter,
  filterPaths,
  isIgnored,
  makePathTest,
  partitionPaths,
} from "../src/filter.ts";

test("directory pattern ignores every file below it", () => {
  const ig = createIgnoreFilter(DEFAULT_PATTERNS);
  assert.equal(ig.ignores("node_modules/pkg/index.js"), true);
  assert.equal(ig.ignores("dist/bundle.js"), true);
  assert.equal(ig.ignores("coverage/lcov.info"), true);
  assert.equal(ig.ignores("src/distractor.ts"), false);
});

test("glob pattern matches at any depth", () => {
  assert.equal(isIgnored(DEFAULT_PATTERNS, "server.log"), true);
  assert.equal(isIgnored(DEFAULT_PATTERNS, "logs/deep/server.log"), true);
  assert.equal(isIgnored(DEFAULT_PATTERNS, "src/server.ts"), false);
});

test("negation keeps a previously ignored file", () => {
  assert.equal(isIgnored(DEFAULT_PATTERNS, "debug.log"), true);
  assert.equal(isIgnored(DEFAULT_PATTERNS, "important.log"), false);
});

test("filter returns only kept paths", () => {
  const paths = [
    "src/index.ts",
    "dist/bundle.js",
    "node_modules/ignore/index.js",
    "debug.log",
    "important.log",
    "coverage/lcov.info",
  ];
  assert.deepEqual(filterPaths(DEFAULT_PATTERNS, paths), [
    "src/index.ts",
    "important.log",
  ]);
});

test("partitionPaths splits ignored from kept", () => {
  const paths = ["src/index.ts", "dist/bundle.js", "important.log"];
  assert.deepEqual(partitionPaths(DEFAULT_PATTERNS, paths), {
    kept: ["src/index.ts", "important.log"],
    ignored: ["dist/bundle.js"],
  });
});

test("createFilter is a reusable boolean predicate", () => {
  const kept = makePathTest(DEFAULT_PATTERNS);
  assert.equal(kept("src/main.ts"), true);
  assert.equal(kept("dist/main.js"), false);
  const selected = ["src/a.ts", "dist/a.js", "trace.log", "important.log"].filter(
    kept,
  );
  assert.deepEqual(selected, ["src/a.ts", "important.log"]);
});
