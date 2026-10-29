import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { buildIndex, buildReceipts } from "../build-index.mjs";

// What a client does with one get_recipe response: hash manifest + files, sorted by path, as path NUL content.
function clientHash(r) {
  const h = crypto.createHash("sha256");
  for (const f of [r.manifest, ...r.files].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))) {
    h.update(f.path + "\0"); h.update(Buffer.from(f.content, "utf8"));
  }
  return "sha256:" + h.digest("hex");
}

const idx = buildIndex({ checked_at: null, recipes: {} });

test("every fresh recipe's recipe_hash can be recomputed from its index entry alone", () => {
  const fresh = idx.recipes.filter((r) => r.receipt.recipe_hash && r.receipt.status !== "stale");
  assert.ok(fresh.length > 0);
  for (const r of fresh) {
    assert.equal(r.manifest.path, "recipe.yaml");
    assert.equal(clientHash(r), r.receipt.recipe_hash, r.id);
    assert.equal(r.manifest.sha256, r.receipt.files?.[`recipes/${r.id}/recipe.yaml`], r.id);
  }
});

test("staleness comes from staleness.json, 'unchecked' when the recipe has no entry", () => {
  const [a, b] = idx.recipes;
  const st = { checked_at: "2026-10-22T01:00:00Z", recipes: {
    [a.id]: { id: a.id, status: "breaks_on_latest", checked_at: "2026-10-22T00:50:00Z", latest: { x: "2.0.0" }, run_url: "https://example.test/1", note: "n" },
  } };
  const built = buildIndex(st);
  const ra = built.recipes.find((r) => r.id === a.id), rb = built.recipes.find((r) => r.id === b.id);
  assert.deepEqual(ra.staleness, { status: "breaks_on_latest", checked_at: "2026-10-22T00:50:00Z", latest: { x: "2.0.0" }, run_url: "https://example.test/1" });
  assert.deepEqual(rb.staleness, { status: "unchecked", checked_at: null, latest: {}, run_url: null });
  // the receipts feed shows the same entry
  assert.deepEqual(buildReceipts(built, st).recipes.find((r) => r.id === a.id).staleness, ra.staleness);
});

test("installed versions stay in receipts/ and are not served", () => {
  for (const r of idx.recipes) assert.equal("installed" in r.receipt, false, r.id);
  for (const r of buildReceipts(idx, { checked_at: null, recipes: {} }).recipes) assert.equal("installed" in r, false, r.id);
});
