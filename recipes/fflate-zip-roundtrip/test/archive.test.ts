import { test } from "node:test";
import assert from "node:assert/strict";
import { zipFiles, unzipFiles, gzipText, gunzipText } from "../src/archive.ts";

test("zip roundtrip preserves files", () => {
  const zipped = zipFiles({
    "readme.txt": "hello",
    "data/a.json": "{\"ok\":true}",
  });
  assert.ok(zipped.length > 20);
  const files = unzipFiles(zipped);
  assert.equal(files["readme.txt"], "hello");
  assert.equal(files["data/a.json"], "{\"ok\":true}");
});

test("gzip roundtrip", () => {
  const gz = gzipText("compress me");
  assert.ok(gz.length > 0);
  assert.equal(gunzipText(gz), "compress me");
});
