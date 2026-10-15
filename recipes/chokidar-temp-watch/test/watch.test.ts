import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { watchDir } from "../src/watch.ts";

test("emits add when a file appears", async () => {
  const dir = mkdtempSync(join(tmpdir(), "chok-"));
  const seen: string[] = [];
  const watcher = watchDir(dir, (p) => seen.push(p));
  try {
    await sleep(100);
    writeFileSync(join(dir, "hello.txt"), "hi");
    const deadline = Date.now() + 3000;
    while (seen.length === 0 && Date.now() < deadline) await sleep(50);
    assert.ok(seen.some((p) => p.endsWith("hello.txt")));
  } finally {
    await watcher.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
