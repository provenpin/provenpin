import { test } from "node:test";
import assert from "node:assert/strict";
import { createIndex, find, save, load, type Doc } from "../src/index.ts";

const docs: Doc[] = [
  { id: 1, title: "Confined space entry", body: "Atmospheric testing before entry and a rescue plan.", category: "safety" },
  { id: 2, title: "Rigging basics", body: "Confined loads, slings and hitches.", category: "lifting" },
  { id: 3, title: "Forklift operation", body: "Pre-shift inspection and load charts.", category: "lifting" },
];

test("title boost ranks title match above body match", () => {
  const r = find(createIndex(docs), "confined");
  assert.deepEqual(r.map((x) => x.id), [1, 2]);
});

test("prefix and fuzzy matching", () => {
  const ms = createIndex(docs);
  assert.equal(find(ms, "fork")[0].id, 3);
  assert.equal(find(ms, "riging")[0].id, 2);
});

test("filter by stored field", () => {
  assert.deepEqual(find(createIndex(docs), "load", "lifting").map((x) => x.id).sort(), [2, 3]);
  assert.deepEqual(find(createIndex(docs), "confined", "safety").map((x) => x.id), [1]);
});

test("discard removes a document", () => {
  const ms = createIndex(docs);
  ms.discard(1);
  assert.deepEqual(find(ms, "confined").map((x) => x.id), [2]);
});

test("autoSuggest", () => {
  const s = createIndex(docs).autoSuggest("insp");
  assert.equal(s[0].suggestion, "inspection");
});

test("JSON serialization round-trips", () => {
  const ms = createIndex(docs);
  const restored = load(save(ms));
  assert.deepEqual(find(restored, "rescue plan"), find(ms, "rescue plan"));
  assert.equal(restored.documentCount, 3);
});
