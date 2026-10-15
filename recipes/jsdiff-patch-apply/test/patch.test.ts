import { test } from "node:test";
import assert from "node:assert/strict";
import { makePatch, apply, undo, stats, wordDiff } from "../src/patch.ts";

const before = ["line 1", "line 2", "line 3", "line 4", "line 5", "line 6", "line 7", "line 8", ""].join("\n");
const after = ["line 1", "line two", "line 3", "line 4", "line 5", "line 6", "line 7", "line 8", "line 9", ""].join("\n");

test("unified patch has headers and hunks", () => {
  const p = makePatch("notes.txt", before, after);
  assert.match(p, /^--- a\/notes\.txt/m);
  assert.match(p, /^\+\+\+ b\/notes\.txt/m);
  assert.match(p, /^-line 2$/m);
  assert.match(p, /^\+line two$/m);
  assert.equal((p.match(/^@@/gm) ?? []).length, 2);
});

test("patch applies and reverses", () => {
  const p = makePatch("notes.txt", before, after);
  const patched = apply(before, p);
  assert.equal(patched, after);
  assert.equal(undo(patched!, p), before);
});

test("conflicting source fails without fuzz, succeeds with fuzz", () => {
  const p = makePatch("notes.txt", before, after);
  // jsdiff rule: context lines right next to an insertion must match exactly, so drift a line further away
  const drifted = before.replace("line 4", "line FOUR");
  assert.equal(apply(drifted, p), null);
  const fuzzed = apply(drifted, p, 1);
  assert.ok(fuzzed?.includes("line two"));
  assert.ok(fuzzed?.includes("line FOUR"));
});

test("line stats", () => {
  assert.deepEqual(stats(before, after), { added: 2, removed: 1, hunks: 2 });
});

test("word diff markers", () => {
  assert.equal(wordDiff("wear safety glasses", "wear safety goggles"), "wear safety [-glasses-]{+goggles+}");
});
