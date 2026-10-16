import diff from "microdiff";

export type DiffEntry = ReturnType<typeof diff>[number];
export type DiffType = DiffEntry["type"];
export type DiffPath = DiffEntry["path"];

export function diffObjects(before: unknown, after: unknown): DiffEntry[] {
  return diff(before, after);
}

export function entriesOfType(entries: DiffEntry[], type: DiffType): DiffEntry[] {
  return entries.filter((entry) => entry.type === type);
}

export function pathsOfType(entries: DiffEntry[], type: DiffType): DiffPath[] {
  return entriesOfType(entries, type).map((entry) => entry.path);
}
