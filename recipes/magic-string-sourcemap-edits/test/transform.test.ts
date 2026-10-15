import { test } from "node:test";
import assert from "node:assert/strict";
import { SourceMapConsumer } from "source-map-js";
import { transform } from "../src/transform.ts";

const input = [
  'const greeting = "hello";',
  "// unused",
  'const target = "world";',
  "console.log(greeting, target);",
  "",
].join("\n");

function locate(text: string, needle: string): { line: number; column: number } {
  const index = text.indexOf(needle);
  assert.notEqual(index, -1, `expected to find ${needle}`);
  const before = text.slice(0, index);
  const lines = before.split("\n");
  return { line: lines.length, column: lines[lines.length - 1].length };
}

test("applies overwrite, prepend, remove and append edits", () => {
  const { code } = transform(input);
  assert.ok(code.includes('const /* left */greeting = "hello";'));
  assert.ok(code.includes('const target = "provenpin";'));
  assert.ok(!code.includes("// unused"));
  assert.ok(code.includes("export const version = 1;"));
});

test("hires sourcemap maps generated positions back to the original", () => {
  const { code, map } = transform(input);
  const consumer = new SourceMapConsumer(map.toString());

  const generated = locate(code, "console.log(greeting, target)");
  const original = locate(input, "console.log(greeting, target)");
  const mapped = consumer.originalPositionFor(generated);

  assert.equal(mapped.source, "input.ts");
  assert.equal(mapped.line, original.line);
  assert.equal(mapped.column, original.column);

  const editedGenerated = locate(code, "const target =");
  const editedOriginal = locate(input, "const target =");
  const editedMapped = consumer.originalPositionFor(editedGenerated);

  assert.equal(editedMapped.line, editedOriginal.line);
  assert.equal(editedMapped.column, editedOriginal.column);
});

test("embedded source content is preserved in the map", () => {
  const { map } = transform(input);
  const raw = JSON.parse(map.toString()) as {
    file: string;
    sources: string[];
    sourcesContent: string[];
  };

  assert.equal(raw.file, "output.ts");
  assert.equal(raw.sources[0], "input.ts");
  assert.equal(raw.sourcesContent[0], input);
});
