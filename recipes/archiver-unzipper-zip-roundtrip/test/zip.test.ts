import { test } from "node:test";
import assert from "node:assert/strict";
import { zipToBuffer, listZip, readEntry, streamEntries } from "../src/zip.ts";

const big = "x".repeat(100_000);
const bin = Buffer.from([0, 1, 2, 250, 251, 252]);

test("zip in memory and list entries", async () => {
  const buf = await zipToBuffer([
    { name: "readme.txt", content: "hello" },
    { name: "data/big.txt", content: big },
    { name: "data/blob.bin", content: bin },
  ]);
  assert.equal(buf.subarray(0, 2).toString(), "PK");
  assert.ok(buf.length < 2000, "deflate should shrink repetitive data");
  assert.deepEqual(await listZip(buf), [
    { path: "readme.txt", size: 5 },
    { path: "data/big.txt", size: 100_000 },
    { path: "data/blob.bin", size: 6 },
  ]);
});

test("random access read of one entry, binary safe", async () => {
  const buf = await zipToBuffer([{ name: "a.txt", content: "A" }, { name: "blob.bin", content: bin }]);
  assert.deepEqual(await readEntry(buf, "blob.bin"), bin);
  assert.equal(await readEntry(buf, "missing"), null);
});

test("streaming parse round-trips text", async () => {
  const buf = await zipToBuffer([{ name: "one.txt", content: "1" }, { name: "dir/two.txt", content: "two ✓" }]);
  assert.deepEqual(await streamEntries(buf), { "one.txt": "1", "dir/two.txt": "two ✓" });
});

test("store mode (level 0) keeps size", async () => {
  const buf = await zipToBuffer([{ name: "big.txt", content: big }], 0);
  assert.ok(buf.length > 100_000);
  assert.equal((await readEntry(buf, "big.txt"))?.toString(), big);
});
