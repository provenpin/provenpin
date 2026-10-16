import { JSONPath } from "jsonpath-plus";

export type Author = { name: string };

export type StoreBook = {
  title: string;
  price: number;
  category: string;
  author: Author;
};

export type Store = {
  store: {
    name: string;
    book: StoreBook[];
    bicycle: { color: string; price: number };
  };
};

export const store: Store = {
  store: {
    name: "Corner Shop",
    book: [
      { title: "Book A", price: 10, category: "fiction", author: { name: "Ann" } },
      { title: "Book B", price: 20, category: "reference", author: { name: "Bob" } },
      { title: "Book C", price: 30, category: "fiction", author: { name: "Cara" } },
    ],
    bicycle: { color: "red", price: 100 },
  },
};

export function values<T = unknown>(json: unknown, path: string): T[] {
  const result = JSONPath({ path, json, resultType: "value" });
  return result as unknown as T[];
}

export function paths(json: unknown, path: string): string[] {
  const result = JSONPath({ path, json, resultType: "path" });
  return result as unknown as string[];
}
