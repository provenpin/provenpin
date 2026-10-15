import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { findSources, findWithStats, partitionTests, escapeForGlob } from "../src/files.ts";

let dir = "";
const tree: Record<string, string> = {
  "src/index.ts": "export {}",
  "src/util/math.ts": "export const add = 1",
  "src/util/math.test.ts": "test",
  "src/__tests__/e2e.ts": "test",
  "src/view.tsx": "<div/>",
  "src/readme.md": "# hi",
  ".config/setup.js": "x",
  "dist/index.js": "built",
  "node_modules/pkg/index.js": "dep",
  "weird [1]/file.ts": "x",
};

before(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "fg-"));
  for (const [rel, body] of Object.entries(tree)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), body);
  }
});
after(() => fs.rmSync(dir, { recursive: true, force: true }));

test("finds sources and skips node_modules, dist and dotfiles", async () => {
  assert.deepEqual(await findSources({ cwd: dir }), [
    "src/__tests__/e2e.ts", "src/index.ts", "src/util/math.test.ts", "src/util/math.ts", "src/view.tsx", "weird [1]/file.ts",
  ]);
});

test("dot and deep options", async () => {
  const withDot = await findSources({ cwd: dir, dot: true });
  assert.ok(withDot.includes(".config/setup.js"));
  const shallow = await findSources({ cwd: dir, deep: 2 });
  assert.equal(shallow.includes("src/util/math.ts"), false);
  assert.ok(shallow.includes("src/index.ts"));
});

test("stats and escaped special characters", async () => {
  const stats = await findWithStats(dir, `${escapeForGlob("weird [1]")}/*.ts`);
  assert.deepEqual(stats, [{ path: "weird [1]/file.ts", size: 1 }]);
});

test("picomatch partitions test files", async () => {
  const { tests, rest } = partitionTests(await findSources({ cwd: dir }));
  assert.deepEqual(tests, ["src/__tests__/e2e.ts", "src/util/math.test.ts"]);
  assert.equal(rest.length, 4);
});
