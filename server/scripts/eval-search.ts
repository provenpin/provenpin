// Scores search on the frozen 2026-10-18 outside-test queries (benchmark/2026-10-18-outside-test/csv/tasks.csv).
// Covered tasks: is the top result one of the tester's fitting recipes? Uncovered tasks: does search say no match?
import fs from "node:fs";
import path from "node:path";
import { searchRecipes, type RecipeIndex } from "../src/search.ts";

const root = path.resolve(import.meta.dirname, "../..");
const index: RecipeIndex = JSON.parse(fs.readFileSync(path.join(root, "index/index.json"), "utf8"));
const csvText = fs.readFileSync(path.join(root, "benchmark/2026-10-18-outside-test/csv/tasks.csv"), "utf8");

function parseCsv(s: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], f = "", q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"' && s[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
    else if (c !== "\r") f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}
const [head, ...body] = parseCsv(csvText);
const tasks = body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));

let covered = 0, top1 = 0, top3 = 0, falseNoMatch = 0, uncovered = 0, noMatch = 0;
const verbose = process.argv.includes("--verbose");
for (const t of tasks) {
  const res = searchRecipes(index, t.query);
  const isCovered = t.covered === "True";
  const fit = new Set(t.fitting_recipes.split(";").filter(Boolean));
  if (isCovered) {
    covered++;
    if (res[0] && fit.has(res[0].id)) top1++;
    if (res.slice(0, 3).some((r) => fit.has(r.id))) top3++;
    if (!res.length) falseNoMatch++;
  } else {
    uncovered++;
    if (!res.length) noMatch++;
  }
  if (verbose) console.log([t.task_id, isCovered ? "cov" : "unc", res.length, res[0]?.id ?? "-", res[0]?.score ?? "-", isCovered ? (res[0] && fit.has(res[0].id) ? "fit" : "MISS") : (res.length ? "SHOWN" : "nomatch")].join("\t"));
}
const r = (k: number, n: number) => `${(k / n).toFixed(3)} (${k}/${n})`;
console.log(`recipes in index: ${index.recipes.length}`);
console.log(`covered top1 ${r(top1, covered)}  top3 ${r(top3, covered)}  covered with no results ${falseNoMatch}`);
console.log(`uncovered honest no-match ${r(noMatch, uncovered)}`);

// Guard against honest-looking but wrong "no match": every recipe's own title, and every stack name alone, must still find something.
const passed = index.recipes.filter((x) => x.receipt.status === "passed");
const titleEmpty = passed.filter((x) => !searchRecipes(index, x.title).length).map((x) => x.id);
const titleSelf = passed.filter((x) => searchRecipes(index, x.title)[0]?.id === x.id).length;
const stacks = [...new Set(passed.flatMap((x) => x.stack))];
const stackEmpty = stacks.filter((s) => !searchRecipes(index, s).length);
console.log(`recipe titles as queries: ${titleEmpty.length} of ${passed.length} with no results${titleEmpty.length ? " (" + titleEmpty.join(", ") + ")" : ""}; top1 is the recipe itself ${r(titleSelf, passed.length)}`);
console.log(`stack names as queries: ${stackEmpty.length} of ${stacks.length} with no results${stackEmpty.length ? " (" + stackEmpty.join(", ") + ")" : ""}`);
