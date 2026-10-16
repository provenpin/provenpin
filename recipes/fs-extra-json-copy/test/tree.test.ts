import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {
  createTree,
  readConfig,
  copyTree,
  moveTree,
  exists,
  removeTree,
  makeTempDir,
} from "../src/tree.ts";

test("writeJson/readJson roundtrips a config", async () => {
  const dir = await makeTempDir();
  try {
    const { configPath } = await createTree(dir);
    assert.equal(await exists(configPath), true);
    const config = await readConfig(configPath);
    assert.deepEqual(config, { name: "provenpin", version: 1, tags: ["a", "b"] });
  } finally {
    await removeTree(dir);
  }
});

test("copy duplicates the tree and move updates paths", async () => {
  const dir = await makeTempDir();
  try {
    const { sourceDir } = await createTree(dir);

    const copyDir = path.join(dir, "copy");
    await copyTree(sourceDir, copyDir);
    assert.equal(await exists(path.join(copyDir, "config.json")), true);
    assert.equal((await readConfig(path.join(copyDir, "config.json"))).name, "provenpin");

    const movedDir = path.join(dir, "moved");
    await moveTree(sourceDir, movedDir);
    assert.equal(await exists(sourceDir), false);
    assert.equal(await exists(path.join(movedDir, "config.json")), true);
    assert.equal((await readConfig(path.join(movedDir, "config.json"))).version, 1);
  } finally {
    await removeTree(dir);
  }
});

test("remove deletes the tree", async () => {
  const dir = await makeTempDir();
  const { sourceDir } = await createTree(dir);
  await removeTree(sourceDir);
  assert.equal(await exists(sourceDir), false);
  await removeTree(dir);
});
