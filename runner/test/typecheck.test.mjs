import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT, listRecipeIds, loadRecipe } from "../lib.mjs";
import { tsFiles, declFiles, tsconfigFor, typecheckRecipe, knownFailures, verdict, ownErrors, tscStatus } from "../typecheck.mjs";

test("tsconfig checks only the recipe's TypeScript files, strictly, without emitting", () => {
  const r = { files: ["package.json", "src/a.ts", "src/b.tsx", "src/env.d.ts", "test/a.test.ts", "README.md"] };
  assert.deepEqual(tsFiles(r), ["src/a.ts", "src/b.tsx", "test/a.test.ts"]);
  const c = tsconfigFor(r);
  assert.deepEqual(c.files, ["src/a.ts", "src/b.tsx", "test/a.test.ts", "src/env.d.ts"]);
  assert.equal(c.compilerOptions.strict, true);
  assert.equal(c.compilerOptions.noEmit, true);
  assert.equal(c.compilerOptions.module, "nodenext");
  assert.equal(c.compilerOptions.jsx, "react-jsx");
  assert.equal(tsconfigFor({ files: ["src/a.ts"] }).compilerOptions.jsx, undefined);
  assert.equal(tsconfigFor({ files: ["tsconfig.json", "src/a.ts"] }), null);
});

test("recipe declaration files of every flavour are checked, not treated as sources", () => {
  const r = { files: ["src/a.ts", "src/x.d.cts", "src/y.d.mts", "src/z.d.ts", "src/b.cts"] };
  assert.deepEqual(tsFiles(r), ["src/a.ts", "src/b.cts"]);
  assert.deepEqual(declFiles(r), ["src/x.d.cts", "src/y.d.mts", "src/z.d.ts"]);
  assert.deepEqual(tsconfigFor(r).files, ["src/a.ts", "src/b.cts", "src/x.d.cts", "src/y.d.mts", "src/z.d.ts"]);
});

test("with declaration files checked, only errors outside node_modules count", () => {
  const lib = "node_modules/vite/dist/node/index.d.ts(1,1): error TS2307: Cannot find module 'x'.";
  const own = "src/pug.d.ts(18,3): error TS1203: Export assignment cannot be used when targeting ECMAScript modules.";
  assert.deepEqual(ownErrors([lib, own, "  continuation"].join("\n")), [own]);
  assert.equal(tscStatus(2, lib, true), "passed");
  assert.equal(tscStatus(2, `${lib}\n${own}`, true), "failed");
  assert.equal(tscStatus(2, "error TS5058: The specified path does not exist.", true), "failed");
  assert.equal(tscStatus(2, lib, false), "failed");
  assert.equal(tscStatus(1, "Killed", true), "tsc_error");
  assert.equal(tscStatus(124, lib, true), "tsc_error");
  assert.equal(tscStatus(0, "", true), "passed");
});

test("non-TypeScript recipes are skipped without installing anything", () => {
  const id = listRecipeIds().find((x) => loadRecipe(x).language !== "typescript");
  assert.ok(id);
  assert.equal(typecheckRecipe(id).status, "skipped");
});

test("the pinned tsc fails on a type error and passes clean code", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pp-tsc-test-"));
  try {
    const opts = { ...tsconfigFor({ files: ["a.ts"] }).compilerOptions, types: [] };
    fs.writeFileSync(path.join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: opts, files: ["a.ts"] }));
    const tsc = () => spawnSync(process.execPath, [path.join(ROOT, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.json"], { cwd: dir, encoding: "utf8" });
    fs.writeFileSync(path.join(dir, "a.ts"), "export const n: number = \"not a number\";\n");
    const bad = tsc();
    assert.notEqual(bad.status, 0);
    assert.match(bad.stdout + bad.stderr, /TS2322/);
    fs.writeFileSync(path.join(dir, "a.ts"), "export const n: number = 1;\n");
    assert.equal(tsc().status, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("known type-check failures are existing TypeScript recipes, sorted, no repeats", () => {
  const known = knownFailures();
  assert.deepEqual(known, [...new Set(known)].sort());
  const ids = new Set(listRecipeIds());
  for (const id of known) {
    assert.ok(ids.has(id), id);
    assert.equal(loadRecipe(id).language, "typescript", id);
  }
});

test("listed recipes pass only while they still have type errors; tool breakage never passes", () => {
  assert.deepEqual(verdict("failed", true), { status: "known", ok: true });
  assert.deepEqual(verdict("passed", true), { status: "now_passes", ok: false });
  assert.deepEqual(verdict("failed", false), { status: "failed", ok: false });
  assert.deepEqual(verdict("passed", false), { status: "passed", ok: true });
  assert.deepEqual(verdict("skipped", false), { status: "skipped", ok: true });
  for (const s of ["tsc_error", "setup_failed", "invalid"]) assert.equal(verdict(s, true).ok, false, s);
});
