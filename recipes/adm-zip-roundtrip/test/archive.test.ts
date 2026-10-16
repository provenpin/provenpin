import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  listEntries,
  openArchive,
  pack,
  readAsText,
  writeZip,
} from "../src/archive.ts";

test("roundtrips string entries through a buffer", () => {
  const buf = pack([
    { path: "hello.txt", data: "hello world" },
    { path: "nested/data.json", data: JSON.stringify({ ok: true }) },
  ]);

  assert.deepEqual(listEntries(buf).sort(), ["hello.txt", "nested/data.json"]);
  assert.equal(readAsText(buf, "hello.txt"), "hello world");
  assert.equal(readAsText(buf, "nested/data.json"), '{"ok":true}');
});

test("stores folder entries and raw buffers", () => {
  const bytes = Buffer.from([0x00, 0x01, 0x02, 0xff]);
  const buf = pack([
    { path: "assets/", data: "" },
    { path: "assets/logo.bin", data: bytes },
  ]);

  assert.deepEqual(listEntries(buf).sort(), ["assets/", "assets/logo.bin"]);
  const entry = openArchive(buf).getEntry("assets/logo.bin");
  assert.ok(entry);
  assert.deepEqual(entry.getData(), bytes);
  assert.deepEqual(readAsText(buf, "assets/"), "");
});

test("writes a zip to a temp path and reads it back", async () => {
  const dir = await mkdtemp(join(tmpdir(), "adm-zip-"));
  try {
    const target = join(dir, "archive.zip");
    writeZip(
      [
        { path: "a.txt", data: "alpha" },
        { path: "b.txt", data: "beta" },
      ],
      target,
    );

    const raw = await readFile(target);
    assert.deepEqual(listEntries(target).sort(), ["a.txt", "b.txt"]);
    assert.equal(readAsText(raw, "a.txt"), "alpha");
    assert.equal(readAsText(target, "b.txt"), "beta");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("throws for a missing entry", () => {
  const buf = pack([{ path: "only.txt", data: "x" }]);
  assert.throws(() => readAsText(buf, "missing.txt"), /entry not found/);
});
