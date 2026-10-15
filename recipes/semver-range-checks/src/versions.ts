import semver from "semver";

export function satisfiesEngine(version: string, range: string): boolean {
  const v = semver.coerce(version);
  return v !== null && semver.satisfies(v, range);
}

export type UpgradePlan = { current: string; patch: string | null; minor: string | null; major: string | null };

/** Latest stable release within patch, minor and major reach of the current version. */
export function planUpgrades(current: string, available: string[]): UpgradePlan {
  const stable = available.filter((v) => semver.valid(v) && !semver.prerelease(v));
  const newer = (range: string) => {
    const best = semver.maxSatisfying(stable, range);
    return best && semver.gt(best, current) ? best : null;
  };
  const major = semver.maxSatisfying(stable, `>=${current}`);
  return {
    current,
    patch: newer(`~${current}`),
    minor: newer(`^${current}`),
    major: major && semver.major(major) > semver.major(current) ? major : null,
  };
}

export function sortReleases(versions: string[]): string[] {
  return semver.sort(versions.filter((v) => semver.valid(v)));
}

export function bump(version: string, kind: semver.ReleaseType, preid?: string): string {
  const next = semver.inc(version, kind, preid);
  if (!next) throw new Error(`cannot bump ${version}`);
  return next;
}

export function describeRange(range: string): { valid: boolean; min: string | null } {
  const valid = semver.validRange(range) !== null;
  return { valid, min: valid ? semver.minVersion(range)?.version ?? null : null };
}
