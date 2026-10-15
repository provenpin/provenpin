import { create, insert, search } from "@orama/orama";

export type Doc = { id: string; title: string; body: string };

export async function buildIndex(docs: Doc[]) {
  const db = await create({
    schema: {
      id: "string",
      title: "string",
      body: "string",
    } as const,
  });
  for (const doc of docs) await insert(db, doc);
  return db;
}

export async function find(db: Awaited<ReturnType<typeof buildIndex>>, term: string) {
  const result = await search(db, { term, properties: ["title", "body"] });
  return result.hits.map((h) => h.document as Doc);
}
