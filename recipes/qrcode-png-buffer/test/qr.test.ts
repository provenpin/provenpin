import { test } from "node:test";
import assert from "node:assert/strict";
import { toPngBuffer, toDataUrl, toAscii } from "../src/qr.ts";

test("png buffer starts with PNG signature", async () => {
  const buf = await toPngBuffer("https://provenpin.com");
  assert.ok(buf.length > 100);
  assert.equal(buf[0], 0x89);
  assert.equal(buf[1], 0x50);
  assert.equal(buf[2], 0x4e);
  assert.equal(buf[3], 0x47);
});

test("data url and ascii output", async () => {
  const url = await toDataUrl("hello");
  assert.match(url, /^data:image\/png;base64,/);
  const ascii = await toAscii("hi");
  assert.ok(ascii.length > 10);
});
