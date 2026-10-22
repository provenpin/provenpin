// Release check: compares each pinned package with the latest version on npm / PyPI.
// Prints the ids of recipes that have a newer upstream release (one per line), and writes
// index/upstream.json with details. Re-test only these, then bump pins once they pass.
// Usage: node runner/affected.mjs [--json]
import fs from "node:fs";
import path from "node:path";
import { ROOT, listRecipeIds, loadRecipe } from "./lib.mjs";

const cache = new Map();
/** True for a plain stable version (npm semver or PEP 440); false for rc/beta/alpha/canary/next/dev/nightly etc. */
export function isStable(v) { return /^\d+(\.\d+)*$/.test(String(v)); }

const cmp = (a, b) => { const x = a.split(".").map(Number), y = b.split(".").map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0); return 0; };

/** Highest stable version from a list, ignoring every pre-release. */
export function highestStable(versions) { return versions.filter(isStable).sort(cmp).at(-1) ?? null; }

/**
 * Picks the version to test against from npm's `versions` map ({ version: { deprecated? } }).
 * Uses dist-tag `latest` when it is a stable, non-deprecated version (npm's own default; skips stray or dev-tagged
 * releases), else the highest stable non-deprecated one (e.g. when the tag points at an rc).
 * If every stable version is deprecated, version is null and `deprecated` carries npm's message.
 */
export function pickLatest(versions, distLatest) {
  const ok = (v) => isStable(v) && versions[v] && !versions[v].deprecated;
  const version = ok(distLatest) ? distLatest : highestStable(Object.keys(versions).filter(ok));
  if (version) return { version, deprecated: null };
  const dep = (isStable(distLatest) && versions[distLatest]?.deprecated) || versions[highestStable(Object.keys(versions))]?.deprecated;
  return { version: null, deprecated: dep ? String(dep) : null };
}

/** { version, deprecated } for a package's latest release; version null when none is usable. */
export async function latestInfo(runtime, pkg) {
  const key = `${runtime}:${pkg}`;
  if (!cache.has(key)) cache.set(key, (async () => {
    const url = runtime === "node" ? `https://registry.npmjs.org/${pkg.replace("/", "%2F")}` : `https://pypi.org/pypi/${pkg}/json`;
    const res = await fetch(url, runtime === "node" ? { headers: { accept: "application/vnd.npm.install-v1+json" } } : undefined);
    if (!res.ok) return { version: null, deprecated: null };
    const j = await res.json();
    if (runtime === "node") return pickLatest(j.versions ?? {}, j["dist-tags"]?.latest);
    return { version: highestStable(Object.entries(j.releases ?? {}).filter(([, files]) => files.length && !files.every((f) => f.yanked)).map(([v]) => v)), deprecated: null };
  })());
  return cache.get(key);
}

export async function latest(runtime, pkg) { return (await latestInfo(runtime, pkg)).version; }

export async function findAffected(fetchLatest = latest) {
  const out = [];
  for (const id of listRecipeIds()) {
    const r = loadRecipe(id);
    const updates = [];
    for (const [pkg, ver] of Object.entries(r.pinned)) {
      const l = await fetchLatest(r.runtime, pkg);
      if (l && l !== ver) updates.push({ pkg, pinned: ver, latest: l });
    }
    if (updates.length) out.push({ id, updates });
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const affected = await findAffected();
  fs.mkdirSync(path.join(ROOT, "index"), { recursive: true });
  fs.writeFileSync(path.join(ROOT, "index", "upstream.json"), JSON.stringify({ checked_at: new Date().toISOString(), affected }, null, 2));
  if (process.argv.includes("--json")) console.log(JSON.stringify(affected.map((a) => a.id)));
  else for (const a of affected) console.log(a.id);
}
