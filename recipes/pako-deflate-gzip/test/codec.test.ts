import { test } from "node:test";
import assert from "node:assert/strict";
import { deflate as pakoDeflate } from "pako";
import {
  deflateBytes,
  deflateText,
  gzipText,
  inflateBytes,
  inflateText,
  ungzipText,
} from "../src/codec.ts";

test("deflate/inflate roundtrips a Uint8Array", () => {
  const input = new Uint8Array([0, 1, 2, 3, 128, 200, 250, 255]);
  const compressed = deflateBytes(input);
  assert.deepEqual(inflateBytes(compressed), input);
});

test("deflate/inflate roundtrips a string", () => {
  const text = "The quick brown fox jumps over the lazy dog. ".repeat(40);
  const compressed = deflateText(text);
  assert.equal(inflateText(compressed), text);
});

test("gzip/ungzip roundtrips a string", () => {
  const text = "gzip roundtrip payload ".repeat(60);
  const compressed = gzipText(text);
  assert.ok(compressed.length < text.length);
  assert.equal(ungzipText(compressed), text);
});

test("compressed output is smaller for repetitive input", () => {
  const text = "abcabcabc".repeat(2000);
  const compressed = pakoDeflate(text);
  assert.ok(compressed.length < text.length);
});

test("deflate honors the level option", () => {
  const text = "repetitive payload ".repeat(1000);
  const fastest = pakoDeflate(text, { level: 1 });
  const smallest = pakoDeflate(text, { level: 9 });
  assert.ok(smallest.length <= fastest.length);
  assert.equal(inflateText(fastest), text);
  assert.equal(inflateText(smallest), text);
});
