import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
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

export function readReceipt(id) {
  const p = path.join(RECEIPTS, `${id}.json`);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
}

export function parseCounts(out, runtime) {
  if (runtime === "node") {
    const pass = out.match(/^# pass (\d+)/m), fail = out.match(/^# fail (\d+)/m);
    return { passed: pass ? +pass[1] : 0, failed: fail ? +fail[1] : 0 };
  }
  const p = out.match(/(\d+) passed/), f = out.match(/(\d+) failed/), e = out.match(/(\d+) errors?/);
  return { passed: p ? +p[1] : 0, failed: (f ? +f[1] : 0) + (e ? +e[1] : 0) };
}
