import { test } from "node:test";
import assert from "node:assert/strict";
import katex from "katex";
import { renderMath, isParseError } from "../src/render.ts";

test("renders inline math with katex classes and MathML", () => {
  const html = renderMath("x^2");
  assert.match(html, /class="katex"/);
  assert.match(html, /<math[^>]*xmlns="http:\/\/www\.w3\.org\/1998\/Math\/MathML"/);
  assert.match(html, /<annotation encoding="application\/x-tex">/);
  assert.doesNotMatch(html, /katex-display/);
});

test("renders display math with katex-display wrapper", () => {
  const html = renderMath("\\sum_{i=0}^{n} i", { displayMode: true });
  assert.match(html, /class="katex-display"/);
  assert.match(html, /class="katex"/);
  assert.match(html, /<math[^>]*display="block"/);
});

test("throws a ParseError for invalid TeX when throwOnError is true", () => {
  assert.throws(
    () => renderMath("\\frac{"),
    (error: unknown) => isParseError(error),
  );
  assert.throws(() => renderMath("\\undefinedmacro"), katex.ParseError);
});

test("renders an error span for invalid TeX when throwOnError is false", () => {
  let html = "";
  assert.doesNotThrow(() => {
    html = renderMath("\\frac{", { throwOnError: false });
  });
  assert.match(html, /katex-error/);
  assert.match(html, /#cc0000/);
});

test("applies custom macros across a render call", () => {
  const html = renderMath("\\RR", { macros: { "\\RR": "\\mathbb{R}" } });
  assert.match(html, /mathbb/);
  assert.match(html, /<annotation encoding="application\/x-tex">\\RR<\/annotation>/);
});
