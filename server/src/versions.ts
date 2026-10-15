// Compare a caller's project versions with a recipe's pinned versions.
// Input is either a {package: version} map or the raw text of a manifest or lockfile.
// The input is parsed in memory only. It is never logged or stored.

export const MAX_VERSIONS_BYTES = 200_000;
export type Verdict = "exact" | "compatible" | "mismatch" | "not_in_project";
export interface ParsedVersions { format: string; versions: Map<string, string> }
export interface PackageCheck { package: string; tested: string; yours: string | null; verdict: Verdict; warning?: string }
export interface Compatibility {
  overall: "exact" | "compatible" | "mismatch" | "unknown";
  summary: string; detected_format: string; packages: PackageCheck[];
}

/** Normalize a package name so npm and PyPI spellings match (PyPI is case and separator insensitive). */
export const normName = (n: string) => { const s = n.trim().toLowerCase(); return s.startsWith("@") ? s : s.replace(/[-_.]+/g, "-"); };
const put = (m: Map<string, string>, name: string, ver: string, override = true) => {
  const k = normName(name); const v = String(ver ?? "").trim();
  if (!k || !v) return;
  if (override || !m.has(k)) m.set(k, v);
};

export function parsePackageJson(o: any): Map<string, string> {
  const m = new Map<string, string>();
  for (const f of ["peerDependencies", "optionalDependencies", "devDependencies", "dependencies"])
    for (const [k, v] of Object.entries(o?.[f] ?? {})) if (typeof v === "string") put(m, k, v);
  return m;
}
export function parsePackageLock(o: any): Map<string, string> {
  const m = new Map<string, string>();
  for (const [p, v] of Object.entries<any>(o?.packages ?? {})) {
    const i = p.lastIndexOf("node_modules/");
    if (i < 0 || !v?.version) continue;
    const top = p.indexOf("node_modules/") === i; // top-level install wins over nested copies
    put(m, p.slice(i + 13), v.version, top);
  }
  for (const [k, v] of Object.entries<any>(o?.dependencies ?? {})) if (v?.version) put(m, k, v.version, false);
  return m;
}
export function parsePnpmLock(t: string): Map<string, string> {
  const m = new Map<string, string>();
  // importers section: "      next:\n        specifier: ^16\n        version: 16.4.1(react@19...)"
  const imp = /^\s+['"]?(@?[^\s'":]+)['"]?:\s*\n\s+specifier:[^\n]*\n\s+version:\s*['"]?([^\s('"]+)/gm;
  for (const x of t.matchAll(imp)) put(m, x[1], x[2]);
  // packages section: "  next@16.4.1:", "  '@scope/x@1.2.3':", "  /next@16.4.1:", "  /next/16.4.1:" (v5)
  for (const x of t.matchAll(/^ {2}['"]?\/?(@?[^@\s'"\/]+(?:\/[^@\s'"\/]+)?)[@\/](\d[^(:'"\s]*)/gm)) put(m, x[1], x[2], false);
  return m;
}
export function parseYarnLock(t: string): Map<string, string> {
  const m = new Map<string, string>();
  const re = /^("?[^\s#][^\n]*):\s*\n((?:[ \t]+[^\n]*\n?)+)/gm;
  for (const x of t.matchAll(re)) {
    const ver = x[2].match(/^\s+version:?\s+"?([^"\s]+)"?/m)?.[1];
    if (!ver) continue;
    for (const spec of x[1].split(",")) {
      const s = spec.trim().replace(/^"|"$/g, "");
      const at = s.indexOf("@", 1);
      if (at > 0) put(m, s.slice(0, at), ver, false);
    }
  }
  return m;
}
export function parseRequirements(t: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const raw of t.split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, "").trim();
    if (!line || line.startsWith("#") || line.startsWith("-")) continue;
    const x = line.match(/^([A-Za-z0-9][A-Za-z0-9._-]*)(?:\[[^\]]*\])?\s*(===|==|~=|>=|<=|!=|>|<)?\s*([^\s,;]+)?/);
    if (x) put(m, x[1], x[3] ? (x[2] === "==" || x[2] === "===" || !x[2] ? x[3] : x[2] + x[3]) : "*");
  }
  return m;
}
/** poetry.lock and uv.lock: TOML [[package]] tables with name and version keys. */
export function parseTomlLock(t: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const block of t.split(/^\[\[package\]\]\s*$/m).slice(1)) {
    const body = block.split(/^\[(?!\[package)/m)[0];
    const name = body.match(/^name\s*=\s*"([^"]+)"/m)?.[1];
    const ver = body.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
    if (name && ver) put(m, name, ver);
  }
  return m;
}

export function parseVersionsInput(input: unknown): ParsedVersions | { error: string } {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    const m = new Map<string, string>();
    for (const [k, v] of Object.entries(input).slice(0, 2000)) if (typeof v === "string" || typeof v === "number") put(m, k, String(v));
    return { format: "map", versions: m };
  }
  if (typeof input !== "string") return { error: "versions must be an object like {\"zod\": \"3.23.8\"} or the text of a lockfile or manifest." };
  if (new TextEncoder().encode(input).length > MAX_VERSIONS_BYTES) return { error: `versions is too large (max ${MAX_VERSIONS_BYTES / 1000}KB). Pass a {package: version} map or just the relevant part of the lockfile.` };
  const t = input.replace(/^\uFEFF/, "");
  const s = t.trimStart();
  if (s.startsWith("{")) {
    try {
      const o = JSON.parse(s);
      if (o.lockfileVersion !== undefined || o.packages) return { format: "package-lock.json", versions: parsePackageLock(o) };
      if (o.dependencies || o.devDependencies || o.peerDependencies) return { format: "package.json", versions: parsePackageJson(o) };
      return parseVersionsInput(o);
    } catch { return { error: "versions looks like JSON but could not be parsed." }; }
  }
  if (/^\[\[package\]\]/m.test(t)) return { format: /^\[metadata\]/m.test(t) || /poetry/i.test(t.slice(0, 300)) ? "poetry.lock" : "uv.lock", versions: parseTomlLock(t) };
  if (/^lockfileVersion:/m.test(t)) return { format: "pnpm-lock.yaml", versions: parsePnpmLock(t) };
  if (/# yarn lockfile|^__metadata:/m.test(t) || /^"?@?[^\s"]+@[^\n]*:\s*\n\s+version:?\s/m.test(t)) return { format: "yarn.lock", versions: parseYarnLock(t) };
  return { format: "requirements.txt", versions: parseRequirements(t) };
}

// Version comparison. Ranges like ^4.2.0, ~=2.1, >=1.0 are reduced to their base version.
const base = (v: string) => v.replace(/^(npm:)?[\^~=<>!v\s]+/, "").trim();
const parts = (v: string) => (base(v).match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/) ?? []).slice(1).map((x) => (x === undefined ? undefined : +x));
/** The "breaking" line: major, or 0.minor for 0.x versions, following semver conventions. */
export function line(v: string): string | null {
  const [a, b] = parts(v);
  if (a === undefined) return null;
  return a === 0 ? `0.${b ?? 0}` : String(a);
}
const label = (l: string) => (l.startsWith("0.") ? l : `${l}.x`);

export function verdictFor(tested: string, yours: string | undefined): Verdict {
  if (yours === undefined) return "not_in_project";
  if (base(yours) === base(tested)) return "exact";
  const a = line(tested), b = line(yours);
  if (a && b && a === b) return "compatible";
  if (!b) return "compatible"; // "*", "latest", git urls: treat as unknown but not a known break
  return "mismatch";
}

/** Build tools and type packages do not change the recipe's runtime behavior, so they are not checked. */
const TOOLING = /^(@types\/.*|tsx|typescript|ts-node|vitest|jest|supertest|pytest.*|ruff|mypy|black)$/;

export function checkCompatibility(pinned: Record<string, string>, parsed: ParsedVersions): Compatibility {
  const packages: PackageCheck[] = [];
  for (const [pkg, tested] of Object.entries(pinned)) {
    if (TOOLING.test(pkg)) continue;
    const yours = parsed.versions.get(normName(pkg));
    const verdict = verdictFor(tested, yours);
    const c: PackageCheck = { package: pkg, tested, yours: yours ?? null, verdict };
    const tl = line(tested), yl = yours ? line(yours) : null;
    if (verdict === "mismatch") c.warning = `Tested on ${pkg} ${tl ? label(tl) : tested}, you have ${yl ? label(yl) : yours}, APIs may differ. Check the code against your version or upgrade to ${tested}.`;
    else if (verdict === "compatible") c.warning = `Same major line as tested (${tested}), you have ${yours}. Should work, minor differences are possible.`;
    else if (verdict === "not_in_project") c.warning = `${pkg} is not in your project. Install ${pkg}@${tested} to match the tested setup.`;
    packages.push(c);
  }
  const n = (v: Verdict) => packages.filter((p) => p.verdict === v).length;
  const mism = n("mismatch"), inProj = packages.length - n("not_in_project");
  const overall = inProj === 0 ? "unknown" : mism ? "mismatch" : n("compatible") ? "compatible" : "exact";
  const summary = inProj === 0
    ? "None of this recipe's packages were found in your versions."
    : mism
      ? `${mism} of ${packages.length} packages are on a different major version than tested: ${packages.filter((p) => p.verdict === "mismatch").map((p) => `${p.package} (tested ${p.tested}, yours ${p.yours})`).join(", ")}.`
      : `All ${inProj} of your matching packages are on the tested major versions${n("not_in_project") ? `, ${n("not_in_project")} not in your project` : ""}.`;
  return { overall, summary, detected_format: parsed.format, packages };
}

/** Search ranking boost: reward recipes that match the caller's installed versions. */
export function compatBoost(c: Compatibility): number {
  let s = 0;
  for (const p of c.packages) s += p.verdict === "exact" ? 3 : p.verdict === "compatible" ? 2 : p.verdict === "mismatch" ? -2 : 0;
  return s;
}
