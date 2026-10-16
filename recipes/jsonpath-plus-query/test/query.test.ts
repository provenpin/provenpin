import { test } from "node:test";
import assert from "node:assert/strict";
import { store, values, paths, type StoreBook } from "../src/query.ts";

function simplify(path: string): string {
  return path
    .replace(/\[['"]([^'"]+)['"]\]/g, ".$1")
    .replace(/\[(\d+)\]/g, ".$1");
}

test("filter selects books under a price", () => {
  const titles = values<string>(store, "$.store.book[?(@.price < 20)].title");
  assert.deepEqual(titles, ["Book A"]);
});

test("recursive descent collects every price", () => {
  const prices = values<number>(store, "$..price");
  assert.deepEqual(prices, [10, 20, 30, 100]);
});

test("wildcard maps over the book array", () => {
  const names = values<string>(store, "$.store.book[*].author.name");
  assert.deepEqual(names, ["Ann", "Bob", "Cara"]);
});

test("resultType value returns matched nodes", () => {
  const books = values<StoreBook>(store, "$.store.book[?(@.category == 'fiction')]");
  assert.deepEqual(books.map((b) => b.title), ["Book A", "Book C"]);
});

test("resultType path returns matched locations", () => {
  const found = paths(store, "$.store.book[*].title");
  assert.deepEqual(found.map(simplify), [
    "$.store.book.0.title",
    "$.store.book.1.title",
    "$.store.book.2.title",
  ]);
});

test("returned paths round-trip back to the same values", () => {
  const found = paths(store, "$.store.book[*].title");
  const roundTripped = found.map((p) => values<string>(store, p)[0]);
  assert.deepEqual(roundTripped, ["Book A", "Book B", "Book C"]);
});

test("wildcard over an object collects its values", () => {
  const details = values<unknown>(store, "$.store.bicycle.*");
  assert.deepEqual(details, ["red", 100]);
});
