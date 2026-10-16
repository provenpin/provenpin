import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeHtml } from "../src/sanitize.ts";

test("keeps whitelisted markup intact", () => {
  const out = sanitizeHtml("<p>Hello <b>world</b> and <em>friends</em></p>");
  assert.equal(out, "<p>Hello <b>world</b> and <em>friends</em></p>");
});

test("strips script tags and their contents", () => {
  const out = sanitizeHtml("<p>ok</p><script>alert(1)</script>");
  assert.ok(out.includes("<p>ok</p>"));
  assert.ok(!out.toLowerCase().includes("<script"));
  assert.ok(!out.includes("alert(1)"));
});

test("removes event handler attributes but keeps safe ones", () => {
  const out = sanitizeHtml('<a href="https://example.com" onclick="alert(1)">link</a>');
  assert.ok(out.includes("https://example.com"));
  assert.ok(out.includes(">link</a>"));
  assert.ok(!out.toLowerCase().includes("onclick"));
  assert.ok(!out.includes("alert(1)"));
});

test("removes javascript: urls", () => {
  const out = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
  assert.ok(!out.toLowerCase().includes("javascript:"));
  assert.ok(out.includes(">x</a>"));
});

test("strips disallowed tags and their handlers", () => {
  const out = sanitizeHtml('<img src=x onerror=alert(1)><iframe src="https://evil.example"></iframe>');
  assert.ok(!out.toLowerCase().includes("<img"));
  assert.ok(!out.toLowerCase().includes("<iframe"));
  assert.ok(!out.includes("onerror"));
  assert.ok(!out.includes("evil.example"));
});
