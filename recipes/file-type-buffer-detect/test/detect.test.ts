import { test } from "node:test";
import assert from "node:assert/strict";
import { detect } from "../src/detect.ts";

const bytes = (values: number[]): Uint8Array => Uint8Array.from(values);

const PNG = bytes([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
]);

const PDF = bytes([
  0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37,
  0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a, 0x0a,
]);

const ZIP = bytes([
  0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00,
  0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]);

const GIF = bytes([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x64, 0x00,
  0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]);

test("detects png from magic bytes", async () => {
  assert.deepEqual(await detect(PNG), { ext: "png", mime: "image/png" });
});

test("detects pdf from magic bytes", async () => {
  assert.deepEqual(await detect(PDF), { ext: "pdf", mime: "application/pdf" });
});

test("detects zip from magic bytes", async () => {
  assert.deepEqual(await detect(ZIP), { ext: "zip", mime: "application/zip" });
});

test("detects gif from magic bytes", async () => {
  assert.deepEqual(await detect(GIF), { ext: "gif", mime: "image/gif" });
});

test("returns undefined for plain text", async () => {
  const text = new TextEncoder().encode("just some plain text, not a binary format");
  assert.equal(await detect(text), undefined);
});
