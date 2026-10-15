import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "../src/markdown.ts";

test("renders GFM tables, strikethrough and task lists", async () => {
  const { html } = await renderMarkdown([
    "| a | b |", "| - | - |", "| 1 | 2 |", "", "~~old~~ new", "", "- [x] done", "- [ ] todo",
  ].join("\n"));
  assert.match(html, /<table>/);
  assert.match(html, /<td>1<\/td>/);
  assert.match(html, /<del>old<\/del>/);
  assert.match(html, /<input type="checkbox" checked disabled>/);
});

test("drops raw HTML and javascript: links", async () => {
  const { html } = await renderMarkdown('<script>alert(1)</script>\n\n[click](javascript:alert(1)) and [ok](https://example.com)');
  assert.doesNotMatch(html, /<script/);
  assert.doesNotMatch(html, /javascript:/);
  assert.match(html, /<a href="https:\/\/example.com">ok<\/a>/);
});

test("collects a table of contents from headings", async () => {
  const { toc, html } = await renderMarkdown("# Intro\n\nText\n\n## Install *fast*\n\n### Notes");
  assert.deepEqual(toc, [
    { depth: 1, text: "Intro" },
    { depth: 2, text: "Install fast" },
    { depth: 3, text: "Notes" },
  ]);
  assert.match(html, /<h2>Install <em>fast<\/em><\/h2>/);
});
