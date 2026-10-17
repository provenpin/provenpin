import { test } from "node:test";
import assert from "node:assert/strict";
import { runTransform } from "../src/transform.ts";

test("renames an imported identifier and its usages", () => {
  const input = [
    "import { oldName } from './mod';",
    "const value = oldName(1, 2);",
    "",
  ].join("\n");
  const output = runTransform(input, { from: "oldName", to: "newName" });
  assert.equal(
    output,
    [
      "import { newName } from './mod';",
      "const value = newName(1, 2);",
      "",
    ].join("\n"),
  );
});

test("converts a require call to a default import and renames usages", () => {
  const input = [
    "const oldName = require('./mod');",
    "oldName('x');",
    "",
  ].join("\n");
  const output = runTransform(input, { from: "oldName", to: "newName" });
  assert.equal(
    output,
    [
      "import newName from './mod';",
      "newName('x');",
      "",
    ].join("\n"),
  );
});

test("converts a destructured require to a named import", () => {
  const input = [
    "const { oldName } = require('./mod');",
    "oldName();",
    "",
  ].join("\n");
  const output = runTransform(input, { from: "oldName", to: "newName" });
  assert.equal(
    output,
    [
      "import { oldName as newName } from './mod';",
      "newName();",
      "",
    ].join("\n"),
  );
});

test("leaves non-computed member property names untouched", () => {
  const input = [
    "import { oldName } from './mod';",
    "const value = api.oldName;",
    "oldName();",
    "",
  ].join("\n");
  const output = runTransform(input, { from: "oldName", to: "newName" });
  assert.equal(
    output,
    [
      "import { newName } from './mod';",
      "const value = api.oldName;",
      "newName();",
      "",
    ].join("\n"),
  );
});
