import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildIndex,
  deserialize,
  search,
  serialize,
  type Document,
} from "../src/search.ts";

const docs: Document[] = [
  {
    id: "search",
    title: "Full text search",
    body: "lunr builds a search index in the browser.",
  },
  {
    id: "serialize",
    title: "Index serialization",
    body: "Persist a search index using toJSON and reload it.",
  },
  {
    id: "boost",
    title: "Boosting fields",
    body: "Title matches score higher than body matches.",
  },
];

test("finds documents by term", () => {
  const index = buildIndex(docs);
  const results = search(index, "browser");
  assert.equal(results.length, 1);
  assert.equal(results[0]!.ref, "search");
  assert.ok(results[0]!.score > 0);
});

test("returns an empty result set for unknown terms", () => {
  const index = buildIndex(docs);
  assert.deepEqual(search(index, "kubernetes"), []);
});

test("supports field-scoped queries", () => {
  const index = buildIndex(docs);
  const results = search(index, "title:serialization");
  assert.deepEqual(
    results.map((r) => r.ref),
    ["serialize"],
  );
});

test("boosts title matches over body matches", () => {
  const index = buildIndex(docs);
  const results = search(index, "index");
  assert.deepEqual(
    results.map((r) => r.ref),
    ["serialize", "search"],
  );
  assert.ok(results[0]!.score > results[1]!.score);
});

test("round-trips an index through toJSON and lunr.Index.load", () => {
  const index = buildIndex(docs);
  const before = search(index, "browser");

  const json = serialize(index);
  assert.equal(typeof json, "string");

  const reloaded = deserialize(json);
  const after = search(reloaded, "browser");

  assert.deepEqual(after, before);
  assert.equal(after[0]!.ref, "search");
});
