import { test } from "node:test";
import assert from "node:assert/strict";
import { diffObjects, entriesOfType, pathsOfType } from "../src/diff.ts";

test("identical nested objects produce an empty diff", () => {
  const before = { user: { id: "1", tags: ["a", "b"] }, active: true };
  const after = { user: { id: "1", tags: ["a", "b"] }, active: true };
  assert.deepEqual(diffObjects(before, after), []);
});

test("emits CREATE entries with paths for added keys", () => {
  const before = { user: { id: "1" } };
  const after = { user: { id: "1", email: "a@example.com" } };
  const result = diffObjects(before, after);
  assert.deepEqual(pathsOfType(result, "CREATE"), [["user", "email"]]);
  assert.equal(entriesOfType(result, "CREATE")[0].value, "a@example.com");
});

test("emits REMOVE entries with paths for deleted keys", () => {
  const before = { user: { id: "1", email: "a@example.com" } };
  const after = { user: { id: "1" } };
  const result = diffObjects(before, after);
  assert.deepEqual(pathsOfType(result, "REMOVE"), [["user", "email"]]);
});

test("emits CHANGE entries with paths for changed values", () => {
  const before = { total: 10, nested: { count: 1 } };
  const after = { total: 20, nested: { count: 2 } };
  const result = diffObjects(before, after);
  assert.deepEqual(pathsOfType(result, "CHANGE"), [["total"], ["nested", "count"]]);
  assert.deepEqual(entriesOfType(result, "CHANGE")[0], {
    type: "CHANGE",
    path: ["total"],
    value: 20,
    oldValue: 10,
  });
});

test("diffs arrays by index and reports the offending element", () => {
  const result = diffObjects({ list: [1, 2, 3] }, { list: [1, 9, 3] });
  assert.deepEqual(result, [
    { type: "CHANGE", path: ["list", 1], value: 9, oldValue: 2 },
  ]);
});

test("reports array growth as a CREATE at the appended index", () => {
  const result = diffObjects({ list: [1, 2] }, { list: [1, 2, 3] });
  assert.deepEqual(pathsOfType(result, "CREATE"), [["list", 2]]);
});

test("reports array shrink as a REMOVE at the dropped index", () => {
  const result = diffObjects({ list: [1, 2, 3] }, { list: [1, 2] });
  assert.deepEqual(pathsOfType(result, "REMOVE"), [["list", 2]]);
});
