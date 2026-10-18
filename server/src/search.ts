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

const tokenize = (s: string) => s.toLowerCase().split(/[^a-z0-9.+#]+/)
  // Sentence punctuation ("using fastify.") must not glue a dot onto the word.
  .map((t) => t.replace(/^\.+|\.+$/g, "")).filter(Boolean)
  .map((t) => t.replace(/^next(\.?js)?$/, "nextjs").replace(/^postgres(ql)?$/, "postgres"));

// Affixes that people often drop when they name a library ("drizzle" for drizzle-orm,
// "dateutil" for python-dateutil, "anthropic sdk" for @anthropic-ai/sdk is covered by the full form).
const DROP_SUFFIX = new Set(["js", "orm", "sdk", "py", "python", "node"]);
const DROP_PREFIX = new Set(["python", "py", "node"]);

/** Token sequences a query can use to name a package, e.g. "@apollo/server" -> [["apollo","server"]]. */
export function packageForms(name: string): string[][] {
  const n = name.toLowerCase();
  if (n.startsWith("@types/")) return []; // type stubs say nothing about what the recipe is for
  const full = tokenize(n);
  if (!full.length) return [];
  const forms = [full];
  if (full.length > 1 && DROP_SUFFIX.has(full[full.length - 1])) forms.push(full.slice(0, -1));
  if (full.length > 1 && DROP_PREFIX.has(full[0])) forms.push(full.slice(1));
  if (full.length > 1) forms.push([full.join("")]); // "bettersqlite3", "i18next" style spellings
  return forms.filter((f) => f.join("").length >= 3);
}

const containsSeq = (hay: string[], needle: string[]) => {
  outer: for (let i = 0; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
};

interface Doc { r: Recipe; stackTok: Set<string>; tags: Set<string>; title: Set<string>; body: Set<string>; stackPkgs: string[]; otherPkgs: string[] }
interface Stats { docs: Doc[]; n: number; df: Map<string, number>; pkgDf: Map<string, number> }
const statsCache = new WeakMap<RecipeIndex, Stats>();

function stats(index: RecipeIndex): Stats {
  const hit = statsCache.get(index);
  if (hit) return hit;
  const df = new Map<string, number>();
  const pkgDf = new Map<string, number>();
  const docs = index.recipes.map((r) => {
    const stackPkgs = [...new Set(r.stack.map((x) => x.toLowerCase()))];
    const otherPkgs = [...new Set(Object.keys(r.pinned ?? {}).map((x) => x.toLowerCase()))].filter((p) => !stackPkgs.includes(p));
    const d: Doc = {
      r, stackPkgs, otherPkgs,
      stackTok: new Set(r.stack.flatMap(tokenize)), tags: new Set(r.tags.flatMap(tokenize)),
      title: new Set(tokenize(r.title + " " + r.id)), body: new Set(tokenize(r.summary)),
    };
    for (const t of new Set([...d.stackTok, ...d.tags, ...d.title, ...d.body])) df.set(t, (df.get(t) ?? 0) + 1);
    for (const p of [...stackPkgs, ...otherPkgs]) pkgDf.set(p, (pkgDf.get(p) ?? 0) + 1);
    return d;
  });
  const s = { docs, n: docs.length, df, pkgDf };
  statsCache.set(index, s);
  return s;
}

// Rare words carry the meaning of a query; words found in many recipes ("json", "schema", "test") barely move it.
const idf = (n: number, df: number) => Math.log(1 + n / (1 + df));

/** Weights. A library named in the query is the strongest signal we have. */
const W = { stackPkg: 8, pinnedPkg: 2, stackTok: 2, tag: 3, title: 2, body: 1 };

export function searchRecipes(index: RecipeIndex, query: string, opts: { stack?: string[]; language?: string; includeUnverified?: boolean; limit?: number } = {}) {
  const qSeq = tokenize(query);
  const q = [...new Set(qSeq)]; // repeating a word must not multiply its weight
  const { docs, n, df, pkgDf } = stats(index);
  const pkgMatch = new Map<string, boolean>();
  const named = (p: string) => {
    let m = pkgMatch.get(p);
    if (m === undefined) pkgMatch.set(p, (m = packageForms(p).some((f) => containsSeq(qSeq, f))));
    return m;
  };
  const wantStack = (opts.stack ?? []).map((s) => tokenize(s).join(""));
  const scored = docs
    .filter(({ r }) => opts.includeUnverified || r.receipt.status === "passed")
    .filter(({ r }) => !opts.language || r.language === opts.language.toLowerCase())
    .filter(({ r }) => wantStack.every((s) => r.stack.map((x) => tokenize(x).join("")).includes(s)))
    .map((d) => {
      let score = 0;
      for (const t of q) {
        const w = (d.stackTok.has(t) ? W.stackTok : 0) + (d.tags.has(t) ? W.tag : 0) + (d.title.has(t) ? W.title : 0) + (d.body.has(t) ? W.body : 0);
        if (w) score += w * idf(n, df.get(t) ?? 0);
      }
      for (const p of d.stackPkgs) if (named(p)) score += W.stackPkg * idf(n, pkgDf.get(p) ?? 0);
      for (const p of d.otherPkgs) if (named(p)) score += W.pinnedPkg * idf(n, pkgDf.get(p) ?? 0);
      return { r: d.r, score: Math.round(score * 100) / 100 };
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
