import diff from "microdiff";

export type DiffEntry = ReturnType<typeof diff>[number];
export type DiffType = DiffEntry["type"];
export type DiffPath = DiffEntry["path"];

export type Diffable = Record<string, unknown> | unknown[];

export function diffObjects(before: Diffable, after: Diffable): DiffEntry[] {
  return diff(before, after);
}

export function entriesOfType<T extends DiffType>(entries: DiffEntry[], type: T): Extract<DiffEntry, { type: T }>[] {
  return entries.filter((entry): entry is Extract<DiffEntry, { type: T }> => entry.type === type);
}

export function pathsOfType(entries: DiffEntry[], type: DiffType): DiffPath[] {
  return entriesOfType(entries, type).map((entry) => entry.path);
}
