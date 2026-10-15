import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { scrapeListing, scrapeSpecs, parsePrice } from "../src/scrape.ts";

const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");
const PAGE = "https://shop.example.test/c/hand-tools";

test("parsePrice handles currency symbols, thousands separators and cents", () => {
  assert.equal(parsePrice("$24.99"), 2499);
  assert.equal(parsePrice("$1,299.50"), 129950);
  assert.equal(parsePrice("USD 7.5"), 750);
  assert.ok(Number.isNaN(parsePrice("call us")));
});

test("scrapes valid cards with absolute URLs, stock and optional rating", () => {
  const r = scrapeListing(fixture("listing.html"), PAGE);
  assert.equal(r.title, "Hand Tools | Example Store");
  assert.deepEqual(r.products, [
    { sku: "HMR-001", name: "Claw Hammer", priceCents: 2499, inStock: true, url: "https://shop.example.test/p/claw-hammer", rating: 4.5 },
    { sku: "WRN-210", name: "Torque Wrench", priceCents: 129950, inStock: false, url: "https://shop.example.test/p/torque-wrench", rating: null },
  ]);
});

test("invalid cards are reported with zod issue paths", () => {
  const r = scrapeListing(fixture("listing.html"), PAGE);
  assert.equal(r.errors.length, 1);
  assert.equal(r.errors[0].index, 2);
  const fields = r.errors[0].issues.map((i) => i.split(":")[0]).sort();
  assert.deepEqual(fields, ["name", "priceCents", "sku"]);
});

test("resolves the next page link relative to the page URL", () => {
  assert.equal(scrapeListing(fixture("listing.html"), PAGE).nextPage, "https://shop.example.test/c/hand-tools?page=2");
  assert.equal(scrapeListing("<ul class=products></ul>", PAGE).nextPage, null);
});

test("reads a dl spec table with whitespace normalised", () => {
  assert.deepEqual(scrapeSpecs(fixture("specs.html")), { weight: "1.2 kg", material: "Forged steel", warranty: "Lifetime" });
});
