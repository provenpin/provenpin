/** sha256 is "sha256:<hex>" of the exact bytes the receipt tested (absent when unknown). */
export interface RecipeFile { path: string; sha256?: string; content: string }
export interface Receipt {
  status: string; ran_at: string | null; last_passed_at: string | null;
  tests?: { passed: number; failed: number }; environment?: Record<string, string>; recipe_hash?: string;
  /** Repo-relative path -> "sha256:<hex>" for every file covered by recipe_hash. */
  files?: Record<string, string>;
}
export interface Recipe {
  id: string; title: string; summary: string; language: string; runtime: string;
  stack: string[]; tags: string[]; pinned: Record<string, string>; setup: string; test: string;
  files: RecipeFile[]; receipt: Receipt;
}
export interface RecipeIndex { schema_version: number; generated_at: string; count: number; recipes: Recipe[] }

const tokenize = (s: string) => s.toLowerCase().split(/[^a-z0-9.+#]+/).filter(Boolean)
  .map((t) => t.replace(/^next(\.?js)?$/, "nextjs").replace(/^postgres(ql)?$/, "postgres"));

export function searchRecipes(index: RecipeIndex, query: string, opts: { stack?: string[]; language?: string; includeUnverified?: boolean; limit?: number } = {}) {
  const q = tokenize(query);
  const wantStack = (opts.stack ?? []).map((s) => tokenize(s).join(""));
  const scored = index.recipes
    .filter((r) => opts.includeUnverified || r.receipt.status === "passed")
    .filter((r) => !opts.language || r.language === opts.language.toLowerCase())
    .filter((r) => wantStack.every((s) => r.stack.map((x) => tokenize(x).join("")).includes(s)))
    .map((r) => {
      const stack = new Set(r.stack.flatMap(tokenize));
      const tags = new Set(r.tags.flatMap(tokenize));
      const title = new Set(tokenize(r.title + " " + r.id));
      const body = new Set(tokenize(r.summary));
      let score = 0;
      for (const t of q) score += (stack.has(t) ? 5 : 0) + (tags.has(t) ? 3 : 0) + (title.has(t) ? 2 : 0) + (body.has(t) ? 1 : 0);
      return { r, score };
    })
    .filter((x) => q.length === 0 || x.score > 0)
    .sort((a, b) => b.score - a.score || a.r.id.localeCompare(b.r.id));
  return scored.slice(0, opts.limit ?? 10).map(({ r, score }) => ({
    id: r.id, title: r.title, summary: r.summary, stack: r.stack, language: r.language, score,
    pinned: r.pinned, receipt: { status: r.receipt.status, last_passed_at: r.receipt.last_passed_at },
  }));
}

export function listStacks(index: RecipeIndex) {
  const m = new Map<string, number>();
  for (const r of index.recipes) if (r.receipt.status === "passed") for (const s of r.stack) m.set(s, (m.get(s) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, recipes]) => ({ name, recipes }));
}
