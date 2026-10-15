import { test } from "node:test";
import assert from "node:assert/strict";
import { generateDocx } from "../src/generate.ts";
import { toHtml, toRawText } from "../src/read.ts";

test("generates a non-empty in-memory docx buffer", async () => {
  const buffer = await generateDocx();
  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(buffer.length > 0);
  assert.equal(buffer.subarray(0, 2).toString("binary"), "PK");
});

test("convertToHtml renders the heading, paragraph and table", async () => {
  const buffer = await generateDocx();
  const html = await toHtml(buffer);
  assert.match(html, /<h1>Quarterly Report<\/h1>/);
  assert.match(html, /generated entirely in memory/);
  assert.match(html, /<table>/);
  assert.match(html, /<td><p>Widgets<\/p><\/td>/);
  assert.match(html, /<td><p>3<\/p><\/td>/);
});

test("extractRawText preserves the document text", async () => {
  const buffer = await generateDocx();
  const text = await toRawText(buffer);
  assert.match(text, /Quarterly Report/);
  assert.match(text, /generated entirely in memory/);
  assert.match(text, /Widgets/);
  assert.match(text, /Gadgets/);
  assert.match(text, /\b3\b/);
  assert.match(text, /\b5\b/);
});
