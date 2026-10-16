import { test } from "node:test";
import assert from "node:assert/strict";
import {
  joinPosix,
  normalizePosix,
  basenamePosix,
  extnamePosix,
  dirnamePosix,
  relativePosix,
} from "../src/paths.ts";

test("join returns POSIX-style paths", () => {
  assert.equal(joinPosix("src", "utils", "file.ts"), "src/utils/file.ts");
  assert.equal(joinPosix("/root", "..", "boot"), "/boot");
  assert.equal(joinPosix("a", "", "b"), "a/b");
});

test("mixed slash inputs normalize consistently", () => {
  const variants = [
    "src/utils/file.ts",
    "src//utils//file.ts",
    "src\\utils\\file.ts",
    "src/utils/./file.ts",
  ];
  for (const variant of variants) {
    assert.equal(normalizePosix(variant), "src/utils/file.ts");
  }
});

test("normalize resolves dot segments", () => {
  assert.equal(normalizePosix("src/utils/../lib/index.ts"), "src/lib/index.ts");
});

test("basename, extname and dirname operate on POSIX paths", () => {
  assert.equal(basenamePosix("src/utils/file.ts"), "file.ts");
  assert.equal(basenamePosix("src/utils/file.ts", ".ts"), "file");
  assert.equal(extnamePosix("src/utils/file.ts"), ".ts");
  assert.equal(dirnamePosix("src/utils/file.ts"), "src/utils");
});

test("relative computes POSIX-style traversals", () => {
  assert.equal(relativePosix("/a/b/c", "/a/b/d/e"), "../d/e");
  assert.equal(relativePosix("/app/src", "/app/test/unit"), "../test/unit");
  assert.equal(relativePosix("/a/b/c", "/a/b/c/d"), "d");
});
