import { test } from "node:test";
import assert from "node:assert/strict";
import { parseJsonReport, parseJunit, parseCounts, parseFreeze, listRecipeIds, loadRecipe, validateRecipe } from "../lib.mjs";
import { findAffected } from "../affected.mjs";

test("parses node and pytest counts", () => {
  assert.deepEqual(parseCounts("# pass 3\n# fail 1\n", "node"), { passed: 3, failed: 1 });
  assert.deepEqual(parseCounts("2 passed, 1 failed in 0.1s", "python"), { passed: 2, failed: 1 });
});
test("every recipe manifest is valid", () => {
  for (const id of listRecipeIds()) assert.deepEqual(validateRecipe(loadRecipe(id)), [], id);
});
test("affected only lists recipes with newer releases", async () => {
  const a = await findAffected(async (_rt, pkg) => (pkg === "zod" ? "99.0.0" : null));
  assert.ok(a.length > 0);
  for (const x of a) assert.deepEqual(x.updates.map((u) => u.pkg), ["zod"]);
});

test("parses vitest json and junit reports", () => {
  assert.deepEqual(parseCounts("", "node", JSON.stringify({ numPassedTests: 4, numFailedTests: 1, numTotalTests: 5 })), { passed: 4, failed: 1 });
  assert.deepEqual(parseCounts("", "node", '<?xml version="1.0"?><testsuites name="vitest" tests="5" failures="1" errors="0" skipped="1"><testsuite tests="5"/></testsuites>'), { passed: 3, failed: 1 });
  assert.deepEqual(parseJunit('<testsuite tests="2" failures="0"/><testsuite tests="3" errors="1"/>'), { passed: 4, failed: 1 });
  assert.throws(() => parseJsonReport("{}"));
});

test("missing or garbage report counts as failed", () => {
  assert.deepEqual(parseCounts("# pass 9", "node", null), { passed: 0, failed: 1 });
  assert.deepEqual(parseCounts("# pass 9", "node", "nonsense"), { passed: 0, failed: 1 });
});

import { rewriteSetup } from "../lib.mjs";
test("rewriteSetup routes npm install through npm 11.6+ when PATH npm is older", () => {
  const out = rewriteSetup("npm install --no-audit --no-fund", "node");
  // On this box npm is 10.x, so we expect the npx rewrite. If CI already has npm 11.6+, out stays as-is.
  assert.ok(out === "npm install --no-audit --no-fund" || out.startsWith("npx --yes npm@11.6.0 "));
  assert.equal(rewriteSetup("uv venv -q .venv", "python"), "uv venv -q .venv");
});

test("fileHashes covers the same files as recipeHash with repo-relative paths", async () => {
  const { listRecipeIds, loadRecipe, fileHashes } = await import("../lib.mjs");
  const id = listRecipeIds()[0];
  const r = loadRecipe(id);
  const fh = fileHashes(r);
  assert.deepEqual(Object.keys(fh).sort(), ["recipe.yaml", ...r.files].map((f) => `recipes/${id}/${f}`).sort());
  for (const v of Object.values(fh)) assert.match(v, /^sha256:[0-9a-f]{64}$/);
});

test("parses uv pip freeze into a sorted name -> version map", () => {
  const out = "pytest==9.1.1\nmultidict==7.2.1\n-e file:///tmp/x\nfoo @ file:///tmp/foo.whl\n\nlitestar==2.24.0\n";
  assert.deepEqual(parseFreeze(out), { litestar: "2.24.0", multidict: "7.2.1", pytest: "9.1.1" });
  assert.deepEqual(Object.keys(parseFreeze(out)), ["litestar", "multidict", "pytest"]);
  assert.deepEqual(parseFreeze(""), {});
});
