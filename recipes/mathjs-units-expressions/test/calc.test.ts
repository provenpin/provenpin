import { test } from "node:test";
import assert from "node:assert/strict";
import { math, big, evalFormula, convert, compileRule, exactSum } from "../src/calc.ts";

test("evaluates formulas with a scope", () => {
  assert.equal(evalFormula("price * qty * (1 - discount)", { price: 20, qty: 3, discount: 0.25 }), 45);
  assert.equal(evalFormula("sqrt(16) + 2^3"), 12);
  assert.throws(() => evalFormula("[1, 2]"), /expected a number, got DenseMatrix/);
});

test("converts units", () => {
  assert.equal(convert("5 km", "mi"), 3.1069);
  assert.equal(convert("100 degF", "degC", 2), 37.78);
  assert.equal(math.evaluate("2 inch to cm").toString(), "5.08 cm");
});

test("compiled rules run repeatedly", () => {
  const shipping = compileRule("weight > 10 ? 15 : 5 + weight * 0.5");
  assert.equal(shipping({ weight: 4 }), 7);
  assert.equal(shipping({ weight: 12 }), 15);
});

test("matrices", () => {
  const m = math.matrix([[1, 2], [3, 4]]);
  assert.equal(math.det(m), -2);
  assert.deepEqual(math.multiply(m, [1, 1]).toArray(), [3, 7]);
});

test("BigNumber avoids float drift", () => {
  assert.notEqual(0.1 + 0.2, 0.3);
  assert.equal(exactSum(["0.1", "0.2"]), "0.3");
  assert.equal(big.format(big.evaluate("1 / 3"), { precision: 10 }), "0.3333333333");
});

test("import and createUnit are disabled for untrusted input", () => {
  assert.throws(() => math.evaluate('import({x: 1})'), /disabled/);
  assert.throws(() => math.evaluate('createUnit("foo")'), /disabled/);
});
