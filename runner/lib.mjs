import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import YAML from "yaml";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
export const RECIPES = path.join(ROOT, "recipes");
export const RECEIPTS = path.join(ROOT, "receipts");

const REQUIRED = ["id", "title", "summary", "language", "runtime", "stack", "pinned", "files", "setup", "test"];

export function listRecipeIds() {
  return fs.readdirSync(RECIPES).filter((d) => fs.existsSync(path.join(RECIPES, d, "recipe.yaml"))).sort();
}

export function loadRecipe(id) {
  const dir = path.join(RECIPES, id);
  const m = YAML.parse(fs.readFileSync(path.join(dir, "recipe.yaml"), "utf8"));
  return { ...m, dir };
}

/** Returns a list of problems; empty means the manifest is valid. */
export function validateRecipe(r) {
  const errs = [];
  for (const k of REQUIRED) if (r[k] === undefined) errs.push(`missing ${k}`);
  if (r.id !== path.basename(r.dir)) errs.push("id must match folder name");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.id ?? "")) errs.push("id must be kebab-case");
  if (!["node", "python"].includes(r.runtime)) errs.push("runtime must be node or python");
  for (const [k, v] of Object.entries(r.pinned ?? {})) if (!/^\d+\.\d+\.\d+([-.][\w.]+)?$/.test(String(v))) errs.push(`pin ${k}=${v} is not an exact version`);
  if (r.test_report !== undefined && (typeof r.test_report !== "string" || r.test_report.startsWith("/") || r.test_report.includes(".."))) errs.push("test_report must be a relative path inside the recipe");
  for (const f of r.files ?? []) if (!fs.existsSync(path.join(r.dir, f))) errs.push(`file not found: ${f}`);
  // pins must agree with the real dependency manifest
  if (r.runtime === "node") {
    const pj = JSON.parse(fs.readFileSync(path.join(r.dir, "package.json"), "utf8"));
    const all = { ...pj.dependencies, ...pj.devDependencies };
    for (const [k, v] of Object.entries(all)) if (r.pinned?.[k] !== v) errs.push(`package.json ${k}@${v} not pinned in recipe.yaml`);
  } else {
    const req = fs.readFileSync(path.join(r.dir, "requirements.txt"), "utf8").split("\n").filter(Boolean);
    for (const line of req) {
      const [k, v] = line.split("==");
      if (!v) errs.push(`requirements line not pinned: ${line}`);
      else if (r.pinned?.[k] !== v) errs.push(`requirements ${k}==${v} not pinned in recipe.yaml`);
    }
  }
  return errs;
}

/** Content hash of the recipe files, so a receipt is tied to exact code. */
export function recipeHash(r) {
  const h = crypto.createHash("sha256");
  for (const f of ["recipe.yaml", ...r.files].sort()) h.update(f + "\0" + fs.readFileSync(path.join(r.dir, f)));
  return "sha256:" + h.digest("hex");
}

/**
 * Per-file sha256 of the exact bytes hashed by recipeHash, keyed by repo-relative path
 * (e.g. "recipes/<id>/src/app.ts"). Same file set as recipe_hash: recipe.yaml plus r.files.
 */
export function fileHashes(r) {
  const out = {};
  const rel = path.relative(ROOT, r.dir).split(path.sep).join("/");
  for (const f of ["recipe.yaml", ...r.files].sort()) {
    out[`${rel}/${f}`] = "sha256:" + crypto.createHash("sha256").update(fs.readFileSync(path.join(r.dir, f))).digest("hex");
  }
  return out;
}

export function readReceipt(id) {
  const p = path.join(RECEIPTS, `${id}.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
}

/** Counts from a Vitest/Jest-style JSON report ({ numPassedTests, numFailedTests, ... }). */
export function parseJsonReport(text) {
  const j = JSON.parse(text);
  if (typeof j.numPassedTests !== "number") throw new Error("not a vitest/jest JSON report");
  return { passed: j.numPassedTests, failed: (j.numFailedTests ?? 0) + (j.numRuntimeErrorTestSuites ?? 0) + (j.numFailedTestSuites && !j.numFailedTests ? j.numFailedTestSuites : 0) };
}

/** Counts from a JUnit XML report: sums <testsuite> tests/failures/errors/skipped. */
export function parseJunit(xml) {
  let tests = 0, bad = 0, skipped = 0, seen = false;
  const root = xml.match(/<testsuites\b[^>]*>/);
  const tags = root && /\btests="/.test(root[0]) ? [root[0]] : xml.match(/<testsuite\b[^>]*>/g) ?? [];
  for (const tag of tags) {
    const a = (k) => +((tag.match(new RegExp(`\\b${k}="(\\d+)"`)) ?? [])[1] ?? 0);
    tests += a("tests"); bad += a("failures") + a("errors"); skipped += a("skipped"); seen = true;
  }
  if (!seen) throw new Error("no testsuite elements");
  return { passed: Math.max(tests - bad - skipped, 0), failed: bad };
}

/**
 * Test counts for a run. If the recipe declares `test_report` (a JSON or JUnit file written by the
 * test command, e.g. Vitest's json reporter), it is the source of truth; a missing or unreadable
 * report counts as a failure. Otherwise counts are parsed from stdout (node:test TAP or pytest).
 */
export function parseCounts(out, runtime, report) {
  if (report !== undefined) {
    if (report === null) return { passed: 0, failed: 1 };
    try { return report.trim().startsWith("<") ? parseJunit(report) : parseJsonReport(report); }
    catch { return { passed: 0, failed: 1 }; }
  }
  if (runtime === "node") {
    const pass = out.match(/^# pass (\d+)/m), fail = out.match(/^# fail (\d+)/m);
    return { passed: pass ? +pass[1] : 0, failed: fail ? +fail[1] : 0 };
  }
  const p = out.match(/(\d+) passed/), f = out.match(/(\d+) failed/), e = out.match(/(\d+) errors?/);
  return { passed: p ? +p[1] : 0, failed: (f ? +f[1] : 0) + (e ? +e[1] : 0) };
}

/** True when the PATH npm is 11.6+, which includes the arborist peer-set edgesOut fix. */
function npmMeetsMin() {
  const r = spawnSync("npm", ["-v"], { encoding: "utf8" });
  const [maj, min] = (r.stdout || "").trim().split(".").map(Number);
  return maj > 11 || (maj === 11 && min >= 6);
}

/**
 * npm < 11.6 crashes on some Vitest peer trees with
 * "Cannot read properties of null (reading 'edgesOut')".
 * Route node installs through npm@11.6+ when the PATH npm is older.
 */
export function rewriteSetup(cmd, runtime) {
  if (runtime !== "node") return cmd;
  if (!/^\s*npm\s+(install|ci|i)\b/.test(cmd)) return cmd;
  if (npmMeetsMin()) return cmd;
  return cmd.replace(/^\s*npm\s+/, "npx --yes npm@11.6.0 ");
}

