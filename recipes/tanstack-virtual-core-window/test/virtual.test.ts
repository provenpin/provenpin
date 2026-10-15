import { test } from "node:test";
import assert from "node:assert/strict";
import { createListVirtualizer, defaultRangeExtractor, visibleIndexes } from "../src/virtual.ts";

test("computes a window of visible indexes near the top", () => {
  const virtualizer = createListVirtualizer(100, 40, 200);
  const idxs = visibleIndexes(virtualizer);
  assert.ok(idxs.length >= 5);
  assert.ok(idxs.length < 20);
  assert.equal(idxs[0], 0);
  assert.ok(idxs.includes(4));
  assert.equal(virtualizer.getTotalSize(), 4000);
});

test("total size scales with count and estimate", () => {
  assert.equal(createListVirtualizer(10, 50, 100).getTotalSize(), 500);
  assert.equal(createListVirtualizer(20, 25, 100).getTotalSize(), 500);
});

test("defaultRangeExtractor expands overscan", () => {
  const range = defaultRangeExtractor({
    startIndex: 10,
    endIndex: 14,
    overscan: 2,
    count: 100,
  });
  assert.deepEqual(range, [8, 9, 10, 11, 12, 13, 14, 15, 16]);
});
