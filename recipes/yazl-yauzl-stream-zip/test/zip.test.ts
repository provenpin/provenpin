import { test } from "node:test";
import assert from "node:assert/strict";
import { createZip, readZip } from "../src/zip.ts";

test("roundtrips buffers and strings through yazl and yauzl", async () => {
  const archive = await createZip([
    { name: "hello.txt", data: "hello world" },
    { name: "bytes.bin", data: Buffer.from([1, 2, 3, 4]) },
  ]);

  assert.ok(Buffer.isBuffer(archive));

  const entries = await readZip(archive);
  assert.equal(entries.get("hello.txt")?.toString("utf8"), "hello world");
  assert.deepEqual([...entries.get("bytes.bin")!], [1, 2, 3, 4]);
});

test("reads many lazily listed entries", async () => {
  const inputs = Array.from({ length: 5 }, (_, i) => ({
    name: `file-${i}.txt`,
    data: `content-${i}`,
  }));

  const archive = await createZip(inputs);
  const entries = await readZip(archive);

  assert.equal(entries.size, 5);
  assert.equal(entries.get("file-4.txt")?.toString("utf8"), "content-4");
});
