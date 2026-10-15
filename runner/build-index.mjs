// Builds index/index.json (served by the MCP server) and, optionally, per-recipe JSON
// exports for the website: node runner/build-index.mjs [--export <dir>]
import fs from "node:fs";
import path from "node:path";
import { ROOT, listRecipeIds, loadRecipe, readReceipt, recipeHash } from "./lib.mjs";

export function buildIndex() {
  const recipes = listRecipeIds().map((id) => {
    const r = loadRecipe(id);
    const rc = readReceipt(id);
    const fresh = rc && rc.recipe_hash === recipeHash(r);
    return {
      id, title: r.title, summary: r.summary, language: r.language, runtime: r.runtime,
      stack: r.stack, tags: r.tags ?? [], pinned: r.pinned, setup: r.setup, test: r.test,
      files: r.files.map((f) => ({ path: f, content: fs.readFileSync(path.join(r.dir, f), "utf8") })),
      receipt: rc ? {
        status: fresh ? rc.status : "stale", ran_at: rc.ran_at, last_passed_at: rc.last_passed_at,
        tests: rc.tests, environment: rc.environment, recipe_hash: rc.recipe_hash,
      } : { status: "untested", ran_at: null, last_passed_at: null },
    };
  });
  return { schema_version: 1, generated_at: new Date().toISOString(), count: recipes.length, recipes };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const idx = buildIndex();
  fs.mkdirSync(path.join(ROOT, "index"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "index", "index.json"), JSON.stringify(idx));
  const servable = idx.recipes.filter((r) => r.receipt.status === "passed").length;
  console.log(`index: ${idx.count} recipes, ${servable} passed`);
  const i = process.argv.indexOf("--export");
  if (i > 0) {
    const out = process.argv[i + 1];
    fs.mkdirSync(out, { recursive: true });
    for (const r of idx.recipes) {
      fs.writeFileSync(path.join(out, `${r.id}.json`), JSON.stringify({
        id: r.id, title: r.title, summary: r.summary, language: r.language, stack: r.stack, tags: r.tags,
        versions: r.pinned,
        receipt: { status: r.receipt.status, last_passed: r.receipt.last_passed_at, ran_at: r.receipt.ran_at, tests: r.receipt.tests ?? null, environment: r.receipt.environment ?? null },
        files: r.files.map((f) => f.path), setup: r.setup, test: r.test,
      }, null, 2) + "\n");
    }
    fs.writeFileSync(path.join(out, "_index.json"), JSON.stringify({ generated_at: idx.generated_at, count: idx.count,
      recipes: idx.recipes.map((r) => ({ id: r.id, title: r.title, stack: r.stack, status: r.receipt.status, last_passed: r.receipt.last_passed_at })) }, null, 2) + "\n");
    console.log(`exported ${idx.count} recipe files to ${out}`);
  }
}
