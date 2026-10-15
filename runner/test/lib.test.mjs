import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCounts, listRecipeIds, loadRecipe, validateRecipe } from "../lib.mjs";
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
