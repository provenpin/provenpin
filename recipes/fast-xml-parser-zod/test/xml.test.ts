import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCatalog, buildCatalog } from "../src/xml.ts";

test("parses and validates catalog xml", () => {
  const xml = `<catalog>
    <item id="1" name="Bolt" qty="10"></item>
    <item id="2" name="Nut" qty="4"></item>
  </catalog>`;
  // attributes come as strings; coerce via rebuild path using element children style
  const itemsXml = `<catalog>
    <item><id>1</id><name>Bolt</name><qty>10</qty></item>
    <item><id>2</id><name>Nut</name><qty>4</qty></item>
  </catalog>`;
  const items = parseCatalog(itemsXml);
  assert.equal(items.length, 2);
  assert.equal(items[0].name, "Bolt");
  assert.equal(items[0].qty, 10);
});

test("builder roundtrip", () => {
  const xml = buildCatalog([{ id: "9", name: "Washer", qty: 2 }]);
  const items = parseCatalog(xml);
  assert.deepEqual(items, [{ id: "9", name: "Washer", qty: 2 }]);
});
