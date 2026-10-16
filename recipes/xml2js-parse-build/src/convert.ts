import { Builder, parseStringPromise } from "xml2js";

export type Book = {
  id: string;
  lang: string;
  title: string;
  author: string | string[];
};

export type Catalog = {
  catalog: {
    book: Book[];
  };
};

export const parserOptions = {
  explicitArray: false,
  mergeAttrs: true,
} as const;

export async function parseCatalog(xml: string): Promise<Catalog> {
  return (await parseStringPromise(xml, parserOptions)) as Catalog;
}

export function buildCatalog(catalog: Catalog): string {
  const builder = new Builder({ headless: true, renderOpts: { pretty: false } });
  const books = catalog.catalog.book.map(({ id, lang, ...rest }) => ({
    $: { id, lang },
    ...rest,
  }));
  return builder.buildObject({ catalog: { book: books } });
}
