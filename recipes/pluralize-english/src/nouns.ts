import pluralize from "pluralize";

pluralize.addIrregularRule("flarp", "flarpen");
pluralize.addPluralRule(/blorf$/i, "blorfen");

export function toPlural(word: string): string {
  return pluralize(word);
}

export function toSingular(word: string): string {
  return pluralize.singular(word);
}

export function isPlural(word: string): boolean {
  return pluralize.isPlural(word);
}

export function isSingular(word: string): boolean {
  return pluralize.isSingular(word);
}

export function withCount(word: string, count: number): string {
  return pluralize(word, count, true);
}
