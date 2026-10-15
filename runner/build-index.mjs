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
      files: r.files.map((f) => {
        const sha256 = fresh ? rc.files?.[`recipes/${id}/${f}`] : undefined;
        return { path: f, ...(sha256 ? { sha256 } : {}), content: fs.readFileSync(path.join(r.dir, f), "utf8") };
      }),
      receipt: rc ? {
        status: fresh ? rc.status : "stale", ran_at: rc.ran_at, last_passed_at: rc.last_passed_at,
        tests: rc.tests, environment: rc.environment, recipe_hash: rc.recipe_hash,
        ...(rc.files ? { files: rc.files } : {}),
      } : { status: "untested", ran_at: null, last_passed_at: null },
    };
  });
  return { schema_version: 1, generated_at: new Date().toISOString(), count: recipes.length, recipes };
}

const REPO_URL = process.env.PROVENPIN_REPO_URL ?? "https://github.com/provenpin/provenpin";

/** Run URL from a receipt's runner field ("github-actions <run id>"); null for local runs. */
export function runUrl(rc) {
  const m = /^github-actions (\d+)$/.exec(rc?.environment?.runner ?? "");
  return m ? `${REPO_URL}/actions/runs/${m[1]}` : null;
}

export function readStaleness() {
  const p = path.join(ROOT, "index", "staleness.json");
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : { checked_at: null, recipes: {} };
}

/** Public receipts feed: one small entry per recipe, built from receipts/ and index/staleness.json. */
export function buildReceipts(idx, staleness = readStaleness()) {
  return {
    schema_version: 1, generated_at: idx.generated_at, staleness_checked_at: staleness.checked_at ?? null, count: idx.count,
    recipes: idx.recipes.map((r) => {
      const rc = readReceipt(r.id);
      const st = staleness.recipes?.[r.id];
      return {
        id: r.id, language: r.language, pinned: r.pinned,
        runtime: rc?.environment?.runtime ?? r.runtime,
        status: r.receipt.status, last_passed_at: r.receipt.last_passed_at ?? null,
        run_url: rc && r.receipt.status !== "stale" ? runUrl(rc) : null,
        recipe_hash: rc?.recipe_hash ?? null,
        files: rc?.files ?? null,
        staleness: st ? { status: st.status, checked_at: st.checked_at, latest: st.latest, run_url: st.run_url ?? null }
          : { status: "unchecked", checked_at: null, latest: {}, run_url: null },
      };
    }),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const idx = buildIndex();
  fs.mkdirSync(path.join(ROOT, "index"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "index", "index.json"), JSON.stringify(idx));
  fs.writeFileSync(path.join(ROOT, "index", "receipts.json"), JSON.stringify(buildReceipts(idx), null, 1) + "\n");
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
