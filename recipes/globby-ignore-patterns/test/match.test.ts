import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { matchFiles } from "../src/match.ts";

async function makeTree(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "globby-recipe-"));
  await mkdir(join(root, "src"), { recursive: true });
  await mkdir(join(root, "dist"), { recursive: true });
  await writeFile(join(root, "src", "a.ts"), "export const a = 1;\n");
  await writeFile(join(root, "src", "b.ts"), "export const b = 2;\n");
  await writeFile(join(root, "src", "c.test.ts"), "test\n");
  await writeFile(join(root, "dist", "a.ts"), "built\n");
  await writeFile(join(root, "README.md"), "# hi\n");
  return root;
}

test("returns sorted relative paths and excludes ignored files", async () => {
  const root = await makeTree();
  try {
    const paths = await matchFiles(root, {
      patterns: ["**/*.ts"],
      ignore: ["**/*.test.ts", "dist/**"],
    });
    assert.deepEqual(paths, ["src/a.ts", "src/b.ts"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("returns absolute paths when absolute is true", async () => {
  const root = await makeTree();
  try {
    const paths = await matchFiles(root, {
      patterns: ["src/*.ts"],
      ignore: ["**/*.test.ts"],
      absolute: true,
    });
    assert.deepEqual(paths, [join(root, "src", "a.ts"), join(root, "src", "b.ts")].sort());
    for (const p of paths) {
      assert.ok(p.startsWith(root), `${p} should start with ${root}`);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("onlyFiles excludes directories from results", async () => {
  const root = await makeTree();
  try {
    const paths = await matchFiles(root, {
      patterns: ["**/*"],
      onlyFiles: true,
    });
    assert.ok(paths.length > 0);
    assert.ok(!paths.includes("src"));
    assert.ok(!paths.includes("dist"));
    assert.deepEqual(
      paths,
      ["README.md", "dist/a.ts", "src/a.ts", "src/b.ts", "src/c.test.ts"].sort(),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
