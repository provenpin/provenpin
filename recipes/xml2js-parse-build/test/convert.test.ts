import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCatalog, buildCatalog } from "../src/convert.ts";

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <book id="b1" lang="en">
    <title>Dune</title>
    <author>Frank Herbert</author>
    <author>Kevin J. Anderson</author>
  </book>
  <book id="b2" lang="fr">
    <title>Le Petit Prince</title>
    <author>Antoine de Saint-Exupery</author>
  </book>
</catalog>`;

test("parses attributes and repeated elements", async () => {
  const parsed = await parseCatalog(xml);
  assert.equal(parsed.catalog.book.length, 2);
  assert.equal(parsed.catalog.book[0].id, "b1");
  assert.equal(parsed.catalog.book[0].lang, "en");
  assert.equal(parsed.catalog.book[0].title, "Dune");
  assert.deepEqual(parsed.catalog.book[0].author, ["Frank Herbert", "Kevin J. Anderson"]);
  assert.equal(parsed.catalog.book[1].title, "Le Petit Prince");
  assert.equal(parsed.catalog.book[1].author, "Antoine de Saint-Exupery");
});

test("builds XML back from parsed data", async () => {
  const parsed = await parseCatalog(xml);
  const output = buildCatalog(parsed);
  assert.ok(output.includes("<book"));
  assert.ok(output.includes('id="b1"'));
  assert.ok(output.includes("<title>Dune</title>"));
  assert.ok(output.includes("<author>Frank Herbert</author>"));
  assert.ok(output.includes("<author>Kevin J. Anderson</author>"));
  assert.ok(output.includes("<title>Le Petit Prince</title>"));
  assert.equal((output.match(/<book/g) ?? []).length, 2);
});
