import fg from "fast-glob";
import picomatch from "picomatch";

export type FindOptions = { cwd: string; ignore?: string[]; dot?: boolean; deep?: number };

export async function findSources({ cwd, ignore = [], dot = false, deep }: FindOptions): Promise<string[]> {
  const files = await fg(["**/*.{ts,tsx,js}"], {
    cwd,
    dot,
    deep,
    onlyFiles: true,
    ignore: ["**/node_modules/**", "**/dist/**", ...ignore],
  });
  return files.sort();
}

export async function findWithStats(cwd: string, pattern: string) {
  const entries = await fg(pattern, { cwd, stats: true, onlyFiles: true });
  return entries
    .map((e) => ({ path: e.path, size: e.stats!.size }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** Split paths into test files and others with a compiled matcher (fast for large lists). */
export function partitionTests(paths: string[], patterns = ["**/*.test.*", "**/__tests__/**"]) {
  const isTest = picomatch(patterns);
  const tests: string[] = [];
  const rest: string[] = [];
  for (const p of paths) (isTest(p) ? tests : rest).push(p);
  return { tests, rest };
}

export function escapeForGlob(name: string): string {
  return fg.escapePath(name);
}
