import { test } from "node:test";
import assert from "node:assert/strict";
import { newId, isUuidV7, sortedIds } from "../src/ids.ts";

test("creates valid uuid v7", () => {
  const id = newId();
  assert.equal(isUuidV7(id), true);
  assert.match(id, /^[0-9a-f-]{36}$/);
});

test("ids sort roughly by creation time", async () => {
  const a = newId();
  await new Promise((r) => setTimeout(r, 5));
  const b = newId();
  assert.ok(a < b);
  const sorted = sortedIds(5);
  assert.deepEqual(sorted, [...sorted].sort());
  assert.equal(sorted.every(isUuidV7), true);
});
