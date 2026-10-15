import { createTwoFilesPatch, applyPatch, parsePatch, diffWords, diffLines, structuredPatch, reversePatch } from "diff";

export const makePatch = (name: string, before: string, after: string) =>
  createTwoFilesPatch(`a/${name}`, `b/${name}`, before, after, "", "", { context: 2 });

export function apply(source: string, patch: string, fuzzFactor = 0) {
  const out = applyPatch(source, patch, { fuzzFactor });
  return out === false ? null : out;
}

export function undo(patched: string, patch: string) {
  const [p] = parsePatch(patch);
  const out = applyPatch(patched, reversePatch(p));
  return out === false ? null : out;
}

export function stats(before: string, after: string) {
  let added = 0, removed = 0;
  for (const part of diffLines(before, after)) {
    if (part.added) added += part.count ?? 0;
    if (part.removed) removed += part.count ?? 0;
  }
  return { added, removed, hunks: structuredPatch("x", "x", before, after, "", "", { context: 2 }).hunks.length };
}

/** Inline word-level diff rendered with [-old-]{+new+} markers. */
export const wordDiff = (a: string, b: string) =>
  diffWords(a, b).map((p) => (p.added ? `{+${p.value}+}` : p.removed ? `[-${p.value}-]` : p.value)).join("");
