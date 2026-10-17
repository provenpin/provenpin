import { test } from "node:test";
import assert from "node:assert/strict";
import { minifySync, parseSync, transformSync } from "@swc/core";
import { PLAIN_TS_SOURCE, TSX_OPTIONS, TSX_SOURCE, TS_OPTIONS } from "../src/transform.ts";

test("strips TypeScript types from TSX input", () => {
  const { code } = transformSync(TSX_SOURCE, TSX_OPTIONS);
  assert.ok(!code.includes(": string"));
  assert.ok(!code.includes(": number"));
  assert.ok(!code.includes(": Props"));
  assert.ok(!code.includes("type Props"));
  assert.ok(code.includes("Hello"));
});

test("lowers JSX and leaves no TSX syntax", () => {
  const { code } = transformSync(TSX_SOURCE, TSX_OPTIONS);
  assert.ok(!code.includes("<div"));
  assert.ok(code.includes("createElement") || code.includes("jsx"));
});

test("parseSync returns a module AST", () => {
  const ast = parseSync(TSX_SOURCE, { syntax: "typescript", tsx: true });
  assert.equal(ast.type, "Module");
  assert.ok(Array.isArray(ast.body));
  assert.ok(ast.body.length > 0);
});

test("minifySync output is shorter and still evaluates", () => {
  const { code: compiled } = transformSync(PLAIN_TS_SOURCE, TS_OPTIONS);
  const { code: compressed } = minifySync(compiled, { compress: true, mangle: true });
  assert.ok(compressed.length < compiled.length);
  new Function(compressed)();
  assert.equal((globalThis as { __swcResult?: number }).__swcResult, 42);
  delete (globalThis as { __swcResult?: number }).__swcResult;
});
