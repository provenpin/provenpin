import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { acquire, acquireSync, acquireWithRetry, isLocked } from "../src/lock.ts";

async function makeTempFile(): Promise<{ dir: string; file: string }> {
  const dir = await mkdtemp(join(tmpdir(), "proper-lockfile-"));
  const file = join(dir, "data.txt");
  await writeFile(file, "payload");
  return { dir, file };
}

test("a second lock on the same file is rejected while the first is held", async () => {
  const { dir, file } = await makeTempFile();
  try {
    const release = await acquire(file);
    assert.equal(await isLocked(file), true);
    await assert.rejects(() => acquire(file));
    await release();
    assert.equal(await isLocked(file), false);
    const again = await acquire(file);
    await again();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("acquireWithRetry waits for the holder to release", async () => {
  const { dir, file } = await makeTempFile();
  try {
    const release = await acquire(file);
    let acquiredAt = 0;
    const pending = acquireWithRetry(file).then(async (rel) => {
      acquiredAt = Date.now();
      await rel();
    });
    await new Promise((resolve) => setTimeout(resolve, 40));
    assert.equal(acquiredAt, 0);
    await release();
    await pending;
    assert.ok(acquiredAt > 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("lockSync release and check reflect the lock state", async () => {
  const { dir, file } = await makeTempFile();
  try {
    const release = acquireSync(file);
    assert.equal(await isLocked(file), true);
    release();
    assert.equal(await isLocked(file), false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
