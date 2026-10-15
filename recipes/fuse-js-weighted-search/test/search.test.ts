import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSearch, search, serializeIndex, loadSearch, type Product } from "../src/search.ts";

const items: Product[] = [
  { id: "1", title: "Steel toe work boots", brand: "Carhartt", tags: ["safety", "footwear"] },
  { id: "2", title: "Hard hat with visor", brand: "MSA", tags: ["safety", "head"] },
  { id: "3", title: "Insulated gloves", brand: "Steelcase", tags: ["hands", "winter"] },
  { id: "4", title: "Safety glasses", brand: "Uvex", tags: ["eyes"] },
];

test("tolerates typos", () => {
  const fuse = buildSearch(items);
  const r = search(fuse, "hardhat visr");
  assert.equal(r[0].id, "2");
});

test("title weight beats brand and tag weight", () => {
  const fuse = buildSearch(items);
  // "steel" appears in a title (boots) and a brand (Steelcase); weighted title should rank first
  const r = search(fuse, "steel");
  assert.equal(r[0].id, "1");
  assert.ok(r.some((x) => x.id === "3"));
  assert.ok(r[0].score <= r[1].score);
  assert.ok(r[0].keys.includes("title"));
});

test("matches array tags", () => {
  const fuse = buildSearch(items);
  const r = search(fuse, "winter");
  assert.equal(r[0].id, "3");
  assert.deepEqual(r[0].keys, ["tags"]);
});

test("serialized index round-trips with same results", () => {
  const fuse = buildSearch(items);
  const restored = loadSearch(items, serializeIndex(fuse));
  assert.deepEqual(search(restored, "glasses"), search(fuse, "glasses"));
});

test("unrelated query returns nothing", () => {
  assert.deepEqual(search(buildSearch(items), "xylophone"), []);
});
