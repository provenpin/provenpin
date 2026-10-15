import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeHtml, sanitizeComment, removedCount } from "../src/sanitize.ts";

test("strips scripts, event handlers and javascript: URLs", () => {
  const out = sanitizeHtml('<p onclick="x()">hi<script>alert(1)</script></p><img src=x onerror="alert(1)"><a href="javascript:alert(1)">bad</a>');
  assert.equal(out.includes("<script"), false);
  assert.equal(out.includes("onerror"), false);
  assert.equal(out.includes("onclick"), false);
  assert.equal(out.includes("javascript:"), false);
  assert.match(out, /<p>hi<\/p>/);
});

test("hardens external links via hook", () => {
  const out = sanitizeHtml('<a href="https://example.com">x</a> <a href="/local">y</a>');
  assert.match(out, /<a href="https:\/\/example.com" target="_blank" rel="noopener noreferrer">x<\/a>/);
  assert.match(out, /<a href="\/local">y<\/a>/);
});

test("comment allow-list keeps text but drops disallowed tags", () => {
  const out = sanitizeComment('<h1>Big</h1><b>bold</b> <iframe src="https://evil"></iframe><span style="color:red">red</span>');
  assert.equal(out, "Big<b>bold</b> red");
});

test("reports how many nodes or attributes were removed", () => {
  assert.equal(removedCount("<b>fine</b>"), 0);
  assert.ok(removedCount('<b onclick="x">x</b><script></script>') >= 2);
});
