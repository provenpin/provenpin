import { test } from "node:test";
import assert from "node:assert/strict";
import { buildArchive, listEntries, readContents } from "../src/archive.ts";
import JSZip from "jszip";

test("builds a zip and lists its entries", async () => {
  const archive = await buildArchive();
  assert.ok(archive instanceof Uint8Array);
  assert.ok(archive.length > 0);

  const entries = await listEntries(archive);
  assert.deepEqual(entries, ["data.bin", "docs/", "docs/readme.txt"]);
});

test("reads text and binary contents back", async () => {
  const archive = await buildArchive();
  const contents = await readContents(archive);

  assert.equal(contents.text, "hello from the docs folder");
  assert.equal(contents.nested, "hello from the docs folder");
  assert.ok(contents.binary instanceof Uint8Array);
  assert.deepEqual([...contents.binary], [0, 1, 2, 255, 254]);
});

test("preserves contents across a second round-trip", async () => {
  const archive = await buildArchive();
  const reloaded = await JSZip.loadAsync(archive);
  const regenerated = await reloaded.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
  });
  const contents = await readContents(regenerated);
  assert.deepEqual([...contents.binary], [0, 1, 2, 255, 254]);
});
