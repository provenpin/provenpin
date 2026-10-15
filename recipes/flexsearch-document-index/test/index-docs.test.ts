import { test } from "node:test";
import assert from "node:assert/strict";
import { addArticles, createArticleIndex, searchArticles } from "../src/index-docs.ts";

test("indexes documents and returns enriched hits", () => {
  const index = createArticleIndex();
  addArticles(index, [
    { id: 1, title: "TypeScript tips", content: "Use strict null checks" },
    { id: 2, title: "Rust ownership", content: "Borrow checker basics" },
  ]);
  const hits = searchArticles(index, "TypeScript");
  assert.ok(hits.some((h) => h.id === 1));
  assert.ok(hits.every((h) => typeof h.title === "string"));
});

test("content field is searchable", () => {
  const index = createArticleIndex();
  addArticles(index, [
    { id: 10, title: "Guide", content: "borrow checker basics for beginners" },
  ]);
  const hits = searchArticles(index, "borrow");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].id, 10);
});
