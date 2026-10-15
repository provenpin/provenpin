import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import type { Highlighter } from "shiki";
import { loadHighlighter } from "../src/highlight.ts";

const tsCode = "const answer: number = 42;";

let highlighter: Highlighter;

before(async () => {
  highlighter = await loadHighlighter();
});

after(() => {
  highlighter.dispose();
});

test("codeToHtml renders a single theme", () => {
  const html = highlighter.codeToHtml(tsCode, { lang: "ts", theme: "github-dark" });
  assert.match(html, /^<pre class="shiki github-dark"/);
  assert.ok(html.includes("<code>"));
  assert.ok(html.includes("</code>"));
  assert.ok(html.includes("</pre>"));
  assert.ok(html.includes("<span style="));
  assert.ok(html.includes(">const</span>"));
});

test("codeToHtml renders dual themes with dark CSS variables", () => {
  const html = highlighter.codeToHtml(tsCode, {
    lang: "ts",
    themes: { light: "github-light", dark: "github-dark" },
  });
  assert.match(html, /^<pre class="shiki shiki-themes github-light github-dark"/);
  assert.ok(html.includes("--shiki-dark"));
  assert.ok(html.includes("--shiki-dark-bg"));
  assert.ok(html.includes(">const</span>"));
});

test("codeToTokens exposes token content and colors", () => {
  const result = highlighter.codeToTokens(tsCode, { lang: "ts", theme: "github-dark" });
  assert.ok(result.tokens.length >= 1);
  const joined = result.tokens
    .map((line) => line.map((token) => token.content).join(""))
    .join("\n");
  assert.equal(joined, tsCode);
  const keyword = result.tokens.flat().find((token) => token.content === "const");
  assert.ok(keyword, "expected a const keyword token");
  assert.match(keyword.color ?? "", /^#[0-9A-Fa-f]{6}$/);
});

test("codeToTokens highlights json strings", () => {
  const json = '{ "name": "provenpin", "version": 1 }';
  const result = highlighter.codeToTokens(json, { lang: "json", theme: "github-light" });
  const tokens = result.tokens.flat();
  assert.ok(tokens.some((token) => token.content.includes("provenpin")));
  assert.ok(tokens.some((token) => token.content === "1"));
});
