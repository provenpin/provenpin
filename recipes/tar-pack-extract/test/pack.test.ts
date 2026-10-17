import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createTarball, extractTarball, listEntries, writeTree } from "../src/pack.ts";

function makeSource(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tar-src-"));
  writeTree(dir, {
    "pkg/index.ts": "export const answer = 42;\n",
    "pkg/util/helper.ts": "export const greet = (name: string): string => `hi ${name}`;\n",
    "pkg/notes.md": "# notes\n",
    "pkg/secret/key.txt": "top-secret\n",
  });
  return dir;
}

test("creates a gzipped tarball and lists its file entries", () => {
  const source = makeSource();
  const tarball = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "tar-out-")), "pkg.tgz");

  createTarball(source, tarball, ["pkg"]);

  assert.ok(fs.existsSync(tarball));

  const magic = fs.readFileSync(tarball).subarray(0, 2);
  assert.deepEqual([...magic], [0x1f, 0x8b]);

  const files = listEntries(tarball)
    .filter((name) => !name.endsWith("/"))
    .sort();

  assert.deepEqual(files, [
    "pkg/index.ts",
    "pkg/notes.md",
    "pkg/secret/key.txt",
    "pkg/util/helper.ts",
  ]);
});

test("extracts with a filter and strip, preserving contents", () => {
  const source = makeSource();
  const workdir = fs.mkdtempSync(path.join(os.tmpdir(), "tar-work-"));
  const tarball = path.join(workdir, "pkg.tgz");
  const dest = path.join(workdir, "out");

  createTarball(source, tarball, ["pkg"]);

  extractTarball(tarball, dest, {
    strip: 1,
    filter: (entryPath) => !entryPath.includes("secret"),
  });

  assert.equal(
    fs.readFileSync(path.join(dest, "index.ts"), "utf8"),
    "export const answer = 42;\n",
  );
  assert.equal(
    fs.readFileSync(path.join(dest, "util/helper.ts"), "utf8"),
    "export const greet = (name: string): string => `hi ${name}`;\n",
  );
  assert.equal(fs.readFileSync(path.join(dest, "notes.md"), "utf8"), "# notes\n");
  assert.equal(fs.existsSync(path.join(dest, "secret")), false);
});
