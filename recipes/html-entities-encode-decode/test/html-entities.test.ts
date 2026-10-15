import { test } from "node:test";
import assert from "node:assert/strict";
import {
  encodeHtml,
  decodeHtml,
  escapeUserContent,
  escapeAttribute,
} from "../src/html-entities.ts";

test("encodes HTML special characters with the specialChars mode", () => {
  assert.equal(
    encodeHtml("<script>a & b</script>"),
    "&lt;script&gt;a &amp; b&lt;/script&gt;",
  );
});

test("specialChars mode leaves non-ASCII characters untouched", () => {
  const input = "café";
  const encoded = encodeHtml(input, "specialChars");
  assert.equal(encoded.includes("é"), true);
  assert.equal(decodeHtml(encoded), input);
});

test("nonAscii mode escapes non-ASCII characters", () => {
  const input = "café";
  const encoded = encodeHtml(input, "nonAscii");
  assert.equal(encoded.includes("é"), false);
  assert.equal(decodeHtml(encoded), input);
});

test("decodes named entities", () => {
  assert.equal(decodeHtml("&copy; &amp; &lt;b&gt;"), "© & <b>");
});

test("decodes decimal and hexadecimal numeric entities", () => {
  assert.equal(decodeHtml("&#65;&#x42;&#67;"), "ABC");
});

test("escapes untrusted user content safely", () => {
  const payload = '<img src=x onerror="alert(1)">';
  const safe = escapeUserContent(payload);
  assert.equal(safe.includes("<"), false);
  assert.equal(safe.includes(">"), false);
  assert.equal(safe.includes('"'), false);
  assert.equal(decodeHtml(safe), payload);
});

test("escapes values for attribute contexts", () => {
  const value = `Tom & "Jerry"`;
  const safe = escapeAttribute(value);
  assert.equal(safe, "Tom &amp; &quot;Jerry&quot;");
  assert.equal(decodeHtml(safe), value);
});
