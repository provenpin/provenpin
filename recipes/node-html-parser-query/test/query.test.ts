import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";
import { extractProducts, applyUpdates, processCatalog } from "../src/query.ts";

const fixture = readFileSync(
  fileURLToPath(new URL("../fixtures/page.html", import.meta.url)),
  "utf8",
);

test("querySelectorAll extracts product data with attributes and text", () => {
  const root = parse(fixture);
  const products = extractProducts(root);
  assert.equal(products.length, 3);
  assert.deepEqual(products[0], {
    sku: "A-1",
    name: "Widget A",
    href: "/p/a1",
    price: 10,
    discontinued: false,
  });
  assert.deepEqual(products[2], {
    sku: "C-3",
    name: "Widget C",
    href: "/p/c3",
    price: 30,
    discontinued: true,
  });
});

test("set_content and setAttribute modify nodes", () => {
  const root = parse(fixture);
  assert.equal(root.querySelector("#title")?.text, "Widgets");
  applyUpdates(root);
  assert.equal(root.querySelector("#title")?.text, "Updated Widgets");
  const first = root.querySelector('li.product[data-sku="A-1"]');
  assert.equal(first?.getAttribute("data-price"), "15");
  assert.equal(first?.querySelector(".price")?.text, "$15");
});

test("remove drops discontinued nodes and serializes back", () => {
  const { before, after, html } = processCatalog(fixture);
  assert.equal(before.length, 3);
  assert.equal(after.length, 2);
  assert.deepEqual(
    after.map((p) => p.sku),
    ["A-1", "B-2"],
  );
  assert.ok(!html.includes("C-3"));
  assert.ok(html.includes('data-price="15"'));
  assert.ok(html.includes("Updated Widgets"));
  assert.ok(html.includes("<title>ProvenPin Demo</title>"));
});
