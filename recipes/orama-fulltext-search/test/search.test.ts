import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIndex, find } from "../src/search.ts";

test("indexes and finds by title term", async () => {
  const db = await buildIndex([
    { id: "1", title: "Alpine hiking boots", body: "Waterproof trail shoes" },
    { id: "2", title: "Kitchen blender", body: "High speed smoothie maker" },
  ]);
  const hits = await find(db, "hiking");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].id, "1");
});

test("finds body matches", async () => {
  const db = await buildIndex([
    { id: "a", title: "Mixer", body: "smoothie maker for fruit" },
    { id: "b", title: "Saw", body: "wood cutting tool" },
  ]);
  const hits = await find(db, "smoothie");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].id, "a");
});
