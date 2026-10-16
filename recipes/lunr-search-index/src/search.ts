import lunr from "lunr";

export type Document = {
  id: string;
  title: string;
  body: string;
};

export type SearchResult = {
  ref: string;
  score: number;
};

export function buildIndex(documents: Document[]): lunr.Index {
  return lunr(function (this: lunr.Builder) {
    this.ref("id");
    this.field("title", { boost: 10 });
    this.field("body");
    for (const doc of documents) {
      this.add(doc);
    }
  });
}

export function search(index: lunr.Index, query: string): SearchResult[] {
  return index.search(query).map((result) => ({
    ref: result.ref,
    score: result.score,
  }));
}

export function serialize(index: lunr.Index): string {
  return JSON.stringify(index);
}

export function deserialize(serialized: string): lunr.Index {
  return lunr.Index.load(JSON.parse(serialized));
}
