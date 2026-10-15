import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkSource,
  formatJson,
  formatMarkdown,
  formatTypeScript,
} from "../src/formatter.ts";

test("formats TypeScript with single quotes and no semicolons", async () => {
  const source =
    'const greeting: string = "hello";\nexport function greet(name: string): string {\n  return `${greeting}, ${name}`;\n}\n';

  const out = await formatTypeScript(source);

  assert.match(out, /'hello'/);
  assert.ok(!out.includes(";"));
  assert.equal(
    out,
    "const greeting: string = 'hello'\nexport function greet(name: string): string {\n  return `${greeting}, ${name}`\n}\n",
  );
});

test("respects printWidth for TypeScript", async () => {
  const source =
    'const message = ["alpha", "beta", "gamma", "delta", "epsilon"].join(", ");\n';

  const out = await formatTypeScript(source, { printWidth: 40 });

  assert.ok(out.split("\n").length > 1);
  assert.ok(!out.includes(";"));
});

test("is idempotent for TypeScript, JSON and Markdown", async () => {
  const tsRaw = 'const x = { a: 1, b: 2 };\n';
  const jsonRaw = '{"a":1,"b":[1,2,3]}';
  const mdRaw = "#   Title\n\nParagraph.\n";

  const tsOnce = await formatTypeScript(tsRaw);
  const jsonOnce = await formatJson(jsonRaw);
  const mdOnce = await formatMarkdown(mdRaw);

  assert.equal(await formatTypeScript(tsOnce), tsOnce);
  assert.equal(await formatJson(jsonOnce), jsonOnce);
  assert.equal(await formatMarkdown(mdOnce), mdOnce);
});

test("check returns true on formatted output and false otherwise", async () => {
  const tsRaw = 'const x = "a";\n';
  const tsFormatted = await formatTypeScript(tsRaw);
  assert.equal(await checkSource(tsFormatted, "typescript"), true);
  assert.equal(await checkSource(tsRaw, "typescript"), false);

  const jsonRaw = '{"a":1}';
  const jsonFormatted = await formatJson(jsonRaw);
  assert.equal(await checkSource(jsonFormatted, "json"), true);
  assert.equal(await checkSource(jsonRaw, "json"), false);

  const mdRaw = "#   Title\n";
  const mdFormatted = await formatMarkdown(mdRaw);
  assert.equal(await checkSource(mdFormatted, "markdown"), true);
  assert.equal(await checkSource(mdRaw, "markdown"), false);
});

test("formats JSON and Markdown predictably", async () => {
  const json = await formatJson('{"a":1,"b":[1,2,3]}');
  assert.deepEqual(JSON.parse(json), { a: 1, b: [1, 2, 3] });
  assert.ok(json.includes("\n"));

  const md = await formatMarkdown("#   Title\n\nParagraph.\n");
  assert.equal(md, "# Title\n\nParagraph.\n");
});
