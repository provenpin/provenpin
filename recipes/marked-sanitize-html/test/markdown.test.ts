import { test } from "node:test";
import assert from "node:assert/strict";
import { renderSafeMarkdown } from "../src/markdown.ts";

test("renders headings and links", async () => {
  const html = await renderSafeMarkdown("# Hello\n\nSee [docs](https://example.com).");
  assert.match(html, /<h1[^>]*>Hello<\/h1>/);
  assert.match(html, /href="https:\/\/example.com"/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test("strips script tags", async () => {
  const html = await renderSafeMarkdown('Hi <script>alert(1)</script> **there**');
  assert.doesNotMatch(html, /<script/i);
  assert.match(html, /<strong>there<\/strong>/);
});

test("keeps code fences", async () => {
  const html = await renderSafeMarkdown("```js\nconst x = 1;\n```");
  assert.match(html, /<code/);
  assert.match(html, /const x = 1/);
});
