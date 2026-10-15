import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "../src/render.ts";

test("renders headings and emphasis", () => {
  const html = renderMarkdown("# Hello\n\n*world*");
  assert.match(html, /<h1>Hello<\/h1>/);
  assert.match(html, /<em>world<\/em>/);
});

test("plugin sets target blank on links", () => {
  const html = renderMarkdown("[docs](https://example.com)");
  assert.match(html, /target="_blank"/);
  assert.match(html, /href="https:\/\/example.com"/);
});
