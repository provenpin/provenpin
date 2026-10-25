// Type-checks TypeScript recipes with tsc: the runner uses tsx, which strips types, so tests alone never catch type errors.
// Usage: node runner/typecheck.mjs [id ...]   (no ids = all recipes; non-TypeScript ids are skipped)
// Recipes listed in runner/typecheck-known.txt had type errors when the check was added: they report "known"
// instead of failing, and fail once they pass, so the list only shrinks. New recipes get no such pass.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT, listRecipeIds, loadRecipe, validateRecipe, rewriteSetup } from "./lib.mjs";

const TIMEOUT_MS = +(process.env.PROVENPIN_TIMEOUT_MS ?? 15 * 60 * 1000);
const TSC = path.join(ROOT, "node_modules", "typescript", "bin", "tsc");
const TS_FILE = /\.(ts|tsx|mts|cts)$/;
const DECL_FILE = /\.d\.(ts|mts|cts)$/;
export const KNOWN_FILE = path.join(ROOT, "runner", "typecheck-known.txt");

export function knownFailures() {
  return fs.readFileSync(KNOWN_FILE, "utf8").split("\n").map((l) => l.replace(/#.*/, "").trim()).filter(Boolean);
}

export function tsFiles(r) { return r.files.filter((f) => TS_FILE.test(f) && !DECL_FILE.test(f)); }
export function declFiles(r) { return r.files.filter((f) => DECL_FILE.test(f)); }

// skipLibCheck also skips the recipe's own declaration files, so recipes that ship any are checked with it off
// (this overrides a recipe's own tsconfig too; none of today's recipes has both).
// Diagnostics inside installed packages then show up too; they are not the recipe's, so they are ignored.
export function ownErrors(out) { return out.split("\n").filter((l) => /error TS\d+/.test(l) && !/^node_modules[\\/]/.test(l)); }

// A recipe that ships its own tsconfig.json is checked with it (null here); the rest get this strict default.
export function tsconfigFor(r) {
  if (r.files.includes("tsconfig.json")) return null;
  const files = tsFiles(r);
  const compilerOptions = {
    strict: true, target: "es2022", module: "nodenext", moduleResolution: "nodenext",
    skipLibCheck: true, noEmit: true, allowImportingTsExtensions: true, types: ["node"],
  };
  if (files.some((f) => f.endsWith(".tsx"))) compilerOptions.jsx = "react-jsx";
  return { compilerOptions, files: [...files, ...declFiles(r)] };
}

function sh(cmd, args, cwd) {
  const t0 = Date.now();
  const r = spawnSync(cmd, args, { cwd, encoding: "utf8", timeout: TIMEOUT_MS, maxBuffer: 64 << 20,
    env: { ...process.env, CI: "1", npm_config_update_notifier: "false" } });
  return { code: r.status ?? 124, out: (r.stdout ?? "") + (r.stderr ?? ""), ms: Date.now() - t0 };
}

// status: skipped (not TypeScript) | invalid | setup_failed | tsc_error (tsc broke, no TS diagnostics) | failed (type errors) | passed
export function typecheckRecipe(id) {
  const r = loadRecipe(id);
  if (r.language !== "typescript") return { id, status: "skipped", out: "" };
  const errors = validateRecipe(r);
  if (errors.length) return { id, status: "invalid", out: errors.join("\n") };
  const work = fs.mkdtempSync(path.join(os.tmpdir(), `pp-tsc-${id}-`));
  try {
    for (const f of r.files) { fs.mkdirSync(path.dirname(path.join(work, f)), { recursive: true }); fs.copyFileSync(path.join(r.dir, f), path.join(work, f)); }
    const tsconfig = tsconfigFor(r);
    if (tsconfig) fs.writeFileSync(path.join(work, "tsconfig.json"), JSON.stringify(tsconfig, null, 2) + "\n");
    const setup = sh("bash", ["-c", rewriteSetup(r.setup, r.runtime)], work);
    if (setup.code !== 0) return { id, status: "setup_failed", out: setup.out };
    const checkDecl = declFiles(r).length > 0;
    const tsc = sh(process.execPath, [TSC, "-p", "tsconfig.json", "--noEmit", "--allowImportingTsExtensions", "--pretty", "false",
      ...(checkDecl ? ["--skipLibCheck", "false"] : [])], work);
    return { id, status: tscStatus(tsc.code, tsc.out, checkDecl), out: tsc.out };
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

export function tscStatus(code, out, checkDecl) {
  if (code === 0) return "passed";
  if (checkDecl ? ownErrors(out).length : /error TS\d+/.test(out)) return "failed";
  // Only tsc's own diagnostic exits (1, 2) count: a timed-out or killed run (124) may have cut the output short.
  return checkDecl && (code === 1 || code === 2) && /error TS\d+/.test(out) ? "passed" : "tsc_error";
}

// Applies the known-failures list: a listed recipe with type errors is "known" (ok); a listed recipe that is clean fails as "now_passes".
export function verdict(status, isKnown) {
  if (isKnown && status === "failed") return { status: "known", ok: true };
  if (isKnown && status === "passed") return { status: "now_passes", ok: false };
  return { status, ok: status === "passed" || status === "skipped" };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : listRecipeIds();
  const known = new Set(knownFailures());
  let bad = 0;
  for (const id of ids) {
    const rc = typecheckRecipe(id);
    const { status, ok } = verdict(rc.status, known.has(id));
    if (status === "now_passes") rc.out = "type-checks clean now: remove it from runner/typecheck-known.txt";
    if (!ok) bad++;
    console.log(`${status.padEnd(12)} ${id}`);
    if (status !== "passed" && status !== "skipped") console.log(rc.out.trim().split("\n").slice(-40).map((l) => `  ${l}`).join("\n"));
  }
  process.exitCode = bad ? 1 : 0;
}
