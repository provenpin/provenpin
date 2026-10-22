// Staleness check: re-runs a recipe's tests with its stack libraries bumped to the latest release.
// Works in a temp copy only. Never edits the recipe and never touches receipts/ (last-passed receipts stay as they are).
// Usage: node runner/staleness.mjs [id ...]   writes staleness/<id>.json (one result per recipe)
//        node runner/staleness.mjs --merge <dir>   merges result files into index/staleness.json
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT, listRecipeIds, loadRecipe, validateRecipe, parseCounts, rewriteSetup } from "./lib.mjs";
import { latestInfo } from "./affected.mjs";

const TIMEOUT_MS = +(process.env.PROVENPIN_TIMEOUT_MS ?? 15 * 60 * 1000);
const OUT = path.join(ROOT, "staleness");
const norm = (s) => String(s).toLowerCase().replace(/[-_.]+/g, "-");

function sh(cmd, cwd) {
  const r = spawnSync("bash", ["-c", cmd], { cwd, encoding: "utf8", timeout: TIMEOUT_MS, maxBuffer: 64 << 20,
    env: { ...process.env, CI: "1", npm_config_update_notifier: "false" } });
  return { code: r.status ?? 124, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

/** Pinned packages that belong to the recipe's stack (matched case and separator insensitive). */
export function stackPins(r) {
  const stack = new Set((r.stack ?? []).map(norm));
  return Object.keys(r.pinned ?? {}).filter((k) => stack.has(norm(k)));
}

/** Short reason for a break, e.g. an npm peer-dependency conflict with another pinned package. */
export function breakReason(out, bumped = []) {
  const all = [...out.matchAll(/peer(?:Optional)? (\S+)@"([^"]+)" from (\S+)@(\S+)/g)];
  const m = all.find((x) => bumped.includes(x[1])) ?? all[0];
  if (/ERESOLVE/.test(out) && m) return `no stable release supports it yet: ${m[3]}@${m[4]} requires ${m[1]} ${m[2]}`;
  if (/ERESOLVE|ResolutionImpossible|No solution found/.test(out)) return "dependency conflict on install";
  return null;
}

// Package families released in lock-step: their packages must share one version or they break each other
// (e.g. @nestjs/core 12.2.0 imports from @nestjs/common/internal, which 12.1.3 lacks).
const LOCKSTEP = ["@nestjs/"];

/** Adds the lock-step siblings of bumped packages: same family and same pinned version get the same new version. */
export function lockstepBumps(pinned, bumps) {
  const out = { ...bumps };
  for (const [k, v] of Object.entries(bumps)) {
    const fam = LOCKSTEP.find((p) => k.startsWith(p));
    if (!fam) continue;
    for (const [s, sv] of Object.entries(pinned)) if (s !== k && s.startsWith(fam) && sv === pinned[k] && !(s in out)) out[s] = v;
  }
  return out;
}

/** Rewrites dependency manifests in the temp copy so the given packages use new versions. */
export function bumpManifest(dir, runtime, bumps) {
  if (runtime === "node") {
    const p = path.join(dir, "package.json");
    const pj = JSON.parse(fs.readFileSync(p, "utf8"));
    for (const sec of ["dependencies", "devDependencies"]) for (const k of Object.keys(pj[sec] ?? {})) if (bumps[k]) pj[sec][k] = bumps[k];
    fs.writeFileSync(p, JSON.stringify(pj, null, 2) + "\n");
    fs.rmSync(path.join(dir, "package-lock.json"), { force: true });
  } else {
    const p = path.join(dir, "requirements.txt");
    const lines = fs.readFileSync(p, "utf8").split("\n").map((l) => { const [k] = l.split("=="); return bumps[k] ? `${k}==${bumps[k]}` : l; });
    fs.writeFileSync(p, lines.join("\n"));
  }
}

export async function checkRecipe(id, fetchInfo = latestInfo, r = loadRecipe(id)) {
  const checkedAt = new Date().toISOString();
  const base = { id, checked_at: checkedAt, run_url: process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL ?? "https://github.com"}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : null };
  if (validateRecipe(r).length) return { ...base, status: "error", latest: {}, note: "recipe manifest invalid" };
  let bumps = {};
  const latestVers = {};
  for (const k of stackPins(r)) {
    const { version: l, deprecated } = (await fetchInfo(r.runtime, k).catch(() => null)) ?? {};
    if (!l && deprecated) return { ...base, status: "deprecated_upstream", latest: {}, deprecated: { [k]: deprecated },
      note: `every stable release of ${k} is deprecated upstream: ${deprecated}` };
    if (!l) return { ...base, status: "error", latest: {}, note: `could not look up latest ${k}` };
    latestVers[k] = l;
    if (l !== r.pinned[k]) bumps[k] = l;
  }
  bumps = lockstepBumps(r.pinned, bumps);
  if (Object.keys(bumps).length === 0) return { ...base, status: "current", latest: latestVers, tests: null, note: "stack pins already latest" };
  const work = fs.mkdtempSync(path.join(os.tmpdir(), `pp-stale-${id}-`));
  try {
    for (const f of r.files) { fs.mkdirSync(path.dirname(path.join(work, f)), { recursive: true }); fs.copyFileSync(path.join(r.dir, f), path.join(work, f)); }
    bumpManifest(work, r.runtime, bumps);
    const setup = sh(rewriteSetup(r.setup, r.runtime), work);
    const test = setup.code === 0 ? sh(r.test, work) : { code: 1, out: "" };
    let report;
    if (r.test_report) { const rp = path.join(work, r.test_report); report = setup.code === 0 && fs.existsSync(rp) ? fs.readFileSync(rp, "utf8") : null; }
    const counts = parseCounts(test.out, r.runtime, report);
    const passed = setup.code === 0 && test.code === 0 && counts.failed === 0 && counts.passed > 0;
    return { ...base, status: passed ? "passes_on_latest" : "breaks_on_latest", latest: latestVers, bumped: bumps,
      tests: { passed: counts.passed, failed: counts.failed }, setup_failed: setup.code !== 0,
      ...(passed ? {} : { reason: breakReason(setup.out + test.out, Object.keys(bumps)) ?? (setup.code !== 0 ? "install failed" : "tests fail on latest"), pinned_kept: true }),
      log_tail: passed ? "" : (setup.code !== 0 ? setup.out : test.out).split("\n").slice(-30).join("\n") };
  } finally { fs.rmSync(work, { recursive: true, force: true }); }
}

export function merge(dir, prevPath = path.join(ROOT, "index", "staleness.json")) {
  const prev = fs.existsSync(prevPath) ? JSON.parse(fs.readFileSync(prevPath, "utf8")) : { recipes: {} };
  const ids = new Set(listRecipeIds());
  const recipes = Object.fromEntries(Object.entries(prev.recipes ?? {}).filter(([k]) => ids.has(k)));
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".json")) : []) {
    const res = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    if (ids.has(res.id)) recipes[res.id] = res;
  }
  const sorted = Object.fromEntries(Object.keys(recipes).sort().map((k) => [k, recipes[k]]));
  const out = { schema_version: 1, checked_at: new Date().toISOString(), recipes: sorted };
  fs.writeFileSync(prevPath, JSON.stringify(out, null, 1) + "\n");
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2);
  if (a[0] === "--merge") {
    const out = merge(a[1]);
    const broken = Object.values(out.recipes).filter((r) => r.status === "breaks_on_latest").map((r) => r.id);
    fs.writeFileSync(path.join(ROOT, "staleness-broken.txt"), broken.join("\n"));
    console.log(`staleness: ${Object.keys(out.recipes).length} recipes, ${broken.length} break on latest`);
  } else {
    fs.mkdirSync(OUT, { recursive: true });
    for (const id of a.length ? a : listRecipeIds()) {
      const res = await checkRecipe(id);
      fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(res, null, 2) + "\n");
      console.log(`${res.status.padEnd(18)} ${id} ${JSON.stringify(res.bumped ?? {})}`);
    }
  }
}
