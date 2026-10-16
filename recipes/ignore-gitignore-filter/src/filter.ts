import ignore from "ignore";

export type IgnoreInstance = ReturnType<typeof ignore>;

export const DEFAULT_PATTERNS = [
  "node_modules/",
  "dist/",
  "coverage/",
  "*.log",
  "!important.log",
];

export function createIgnoreFilter(
  patterns: readonly string[] = DEFAULT_PATTERNS,
): IgnoreInstance {
  return ignore().add([...patterns]);
}

export function isIgnored(
  patterns: readonly string[],
  pathname: string,
): boolean {
  return createIgnoreFilter(patterns).ignores(pathname);
}

export function filterPaths(
  patterns: readonly string[],
  paths: readonly string[],
): string[] {
  return createIgnoreFilter(patterns).filter([...paths]);
}

export function partitionPaths(
  patterns: readonly string[],
  paths: readonly string[],
): { kept: string[]; ignored: string[] } {
  const ig = createIgnoreFilter(patterns);
  const kept: string[] = [];
  const ignored: string[] = [];
  for (const pathname of paths) {
    if (ig.ignores(pathname)) {
      ignored.push(pathname);
    } else {
      kept.push(pathname);
    }
  }
  return { kept, ignored };
}

export function makePathTest(
  patterns: readonly string[] = DEFAULT_PATTERNS,
): (pathname: string) => boolean {
  return createIgnoreFilter(patterns).createFilter();
}
