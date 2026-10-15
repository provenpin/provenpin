import { test } from "node:test";
import assert from "node:assert/strict";
import { parseNested, stringifyNested, parseFilter, toQuery } from "../src/query.ts";

test("parses nested objects and indexed arrays", () => {
  const parsed = parseNested("user[name]=ada&user[roles][0]=admin&user[roles][1]=dev");
  assert.deepEqual(parsed, { user: { name: "ada", roles: ["admin", "dev"] } });
});

test("parses bracket and repeat array formats", () => {
  assert.deepEqual(parseNested("tags[]=a&tags[]=b"), { tags: ["a", "b"] });
  assert.deepEqual(parseNested("tags=a&tags=b"), { tags: ["a", "b"] });
});

test("parses comma separated arrays", () => {
  assert.deepEqual(parseNested("tags=a,b,c", { comma: true }), { tags: ["a", "b", "c"] });
});

test("stringifies arrays in each format", () => {
  const value = { tags: ["a", "b"] };
  assert.equal(stringifyNested(value, { arrayFormat: "indices", encode: false }), "tags[0]=a&tags[1]=b");
  assert.equal(stringifyNested(value, { arrayFormat: "brackets", encode: false }), "tags[]=a&tags[]=b");
  assert.equal(stringifyNested(value, { arrayFormat: "repeat", encode: false }), "tags=a&tags=b");
  assert.equal(stringifyNested(value, { arrayFormat: "comma", encode: false }), "tags=a,b");
});

test("enforces the depth limit while parsing", () => {
  assert.deepEqual(parseNested("a[b][c][d][e][f][g][h][i]=j", { depth: 1 }), {
    a: { b: { "[c][d][e][f][g][h][i]": "j" } },
  });
});

test("parses a typed filter", () => {
  const filter = parseFilter("q=phone&tags[]=mobile&tags[]=sale&price[min]=10&price[max]=99&inStock=true");
  assert.deepEqual(filter, {
    q: "phone",
    tags: ["mobile", "sale"],
    price: { min: 10, max: 99 },
    inStock: true,
  });
});

test("ignores non numeric and non boolean values", () => {
  assert.deepEqual(parseFilter("price[min]=cheap&inStock=maybe"), { tags: [] });
});

test("round-trips a filter through toQuery and parseFilter", () => {
  const filter = { q: "phone", tags: ["sale", "mobile"], price: { min: 10 }, inStock: false };
  const query = toQuery(filter, { encode: false });
  assert.equal(query, "q=phone&tags[0]=sale&tags[1]=mobile&price[min]=10&inStock=false");
  assert.deepEqual(parseFilter(query), filter);
});
