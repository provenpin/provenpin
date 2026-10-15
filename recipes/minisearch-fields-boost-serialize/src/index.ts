import MiniSearch from "minisearch";

export type Doc = { id: number; title: string; body: string; category: string };

export const options = {
  fields: ["title", "body"],
  storeFields: ["title", "category"],
  searchOptions: { boost: { title: 3 }, prefix: true, fuzzy: 0.2 },
};

export function createIndex(docs: Doc[]) {
  const ms = new MiniSearch<Doc>(options);
  ms.addAll(docs);
  return ms;
}

export function find(ms: MiniSearch<Doc>, q: string, category?: string) {
  return ms
    .search(q, category ? { filter: (r) => r.category === category } : undefined)
    .map((r) => ({ id: r.id as number, title: r.title as string, terms: r.terms }));
}

export const save = (ms: MiniSearch<Doc>) => JSON.stringify(ms);
export const load = (json: string) => MiniSearch.loadJSON<Doc>(json, options);
