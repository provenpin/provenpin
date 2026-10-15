import Fuse, { type IFuseOptions } from "fuse.js";

export type Product = { id: string; title: string; brand: string; tags: string[] };

const options: IFuseOptions<Product> = {
  keys: [
    { name: "title", weight: 0.7 },
    { name: "brand", weight: 0.2 },
    { name: "tags", weight: 0.1 },
  ],
  includeScore: true,
  includeMatches: true,
  threshold: 0.4,
  ignoreLocation: true,
};

export function buildSearch(items: Product[]) {
  // Pre-built index so the same index can be cached or shipped to the client.
  const index = Fuse.createIndex(options.keys!, items);
  return new Fuse(items, options, index);
}

export function search(fuse: Fuse<Product>, q: string, limit = 5) {
  return fuse.search(q, { limit }).map((r) => ({ id: r.item.id, score: r.score!, keys: r.matches?.map((m) => m.key) ?? [] }));
}

export function serializeIndex(fuse: Fuse<Product>) {
  return JSON.stringify(fuse.getIndex().toJSON());
}

export function loadSearch(items: Product[], json: string) {
  return new Fuse(items, options, Fuse.parseIndex<Product>(JSON.parse(json)));
}
