import { Document } from "flexsearch";

export type Article = { id: number; title: string; content: string };

export function createArticleIndex() {
  return new Document<Article>({
    document: {
      id: "id",
      index: ["title", "content"],
      store: true,
    },
  });
}

export function addArticles(index: Document<Article>, articles: Article[]) {
  for (const a of articles) index.add(a);
}

export function searchArticles(index: Document<Article>, query: string) {
  const raw = index.search(query, { enrich: true, limit: 10 }) as Array<{
    field: string;
    result: Array<{ id: number; doc: Article }>;
  }>;
  const ids = new Set<number>();
  const docs: Article[] = [];
  for (const field of raw) {
    for (const hit of field.result ?? []) {
      if (!ids.has(hit.id)) {
        ids.add(hit.id);
        docs.push(hit.doc);
      }
    }
  }
  return docs;
}
