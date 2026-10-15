import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { minify } from "../src/minify.ts";

const SOURCE = `function computeTotal(items) {
  const subtotalValue = items.reduce(function (accumulator, currentValue) {
    return accumulator + currentValue;
  }, 0);
  console.log("total", subtotalValue);
  return subtotalValue;
}
globalThis.__recipe = { computeTotal: computeTotal, value: computeTotal([1, 2, 3, 4]) };
`;

test("minifies to a smaller payload", async () => {
  const result = await minify(SOURCE, "recipe.js");
  assert.ok(result.minifiedBytes < result.originalBytes);
  assert.ok(result.code.length < SOURCE.length);
});

test("drops console calls and mangles local names", async () => {
  const { code } = await minify(SOURCE, "recipe.js");
  assert.equal(/console/.test(code), false);
  assert.equal(/subtotalValue/.test(code), false);
  assert.equal(/accumulator/.test(code), false);
});

test("emits a usable v3 source map", async () => {
  const { map } = await minify(SOURCE, "recipe.js");
  const parsed = JSON.parse(map) as { version: number; sources: string[]; mappings: string };
  assert.equal(parsed.version, 3);
  assert.deepEqual(parsed.sources, ["recipe.js"]);
  assert.ok(parsed.mappings.length > 0);
});

test("minified code still runs correctly in node:vm", async () => {
  const { code } = await minify(SOURCE, "recipe.js");
  const context = vm.createContext({});
  vm.runInContext(code, context, { filename: "recipe.min.js" });
  const recipe = (context as Record<string, unknown>).__recipe as {
    value: number;
    computeTotal: (items: number[]) => number;
  };
  assert.equal(recipe.value, 10);
  assert.equal(recipe.computeTotal([5, 10]), 15);
});
