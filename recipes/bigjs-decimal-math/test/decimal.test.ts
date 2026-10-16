import { test } from "node:test";
import assert from "node:assert/strict";
import Big from "big.js";
import {
  RoundingMode,
  add,
  configure,
  divide,
  equals,
  greaterThan,
  power,
  round,
} from "../src/decimal.ts";

test("0.1 + 0.2 equals 0.3 with big.js", () => {
  assert.notEqual(0.1 + 0.2, 0.3);
  const sum = add("0.1", "0.2");
  assert.equal(sum.toString(), "0.3");
  assert.equal(equals(sum, "0.3"), true);
  assert.equal(new Big("0.1").plus("0.2").eq("0.3"), true);
});

test("comparisons use eq and gt", () => {
  assert.equal(equals("0.3", "0.30"), true);
  assert.equal(greaterThan("0.31", "0.3"), true);
  assert.equal(greaterThan("0.3", "0.3"), false);
});

test("division honours DP and rounding mode", () => {
  configure(2, RoundingMode.down);
  const down = divide("1", "3", RoundingMode.down);
  const up = divide("1", "3", RoundingMode.up);
  assert.equal(down.toString(), "0.33");
  assert.equal(up.toString(), "0.34");
  assert.notEqual(down.toString(), up.toString());

  configure(4, RoundingMode.halfUp);
  assert.equal(divide("1", "3", RoundingMode.halfUp).toString(), "0.3333");
});

test("pow raises integer exponents precisely", () => {
  assert.equal(power("2", 10).toString(), "1024");
  assert.equal(power("1.5", 3).toString(), "3.375");
});

test("round applies the requested rounding mode", () => {
  assert.equal(round("2.5", 0, RoundingMode.halfUp).toString(), "3");
  assert.equal(round("2.5", 0, RoundingMode.halfEven).toString(), "2");
  assert.equal(round("2.1", 0, RoundingMode.up).toString(), "3");
  assert.equal(round("2.9", 0, RoundingMode.down).toString(), "2");
  assert.equal(round("1.005", 2, RoundingMode.halfUp).toString(), "1.01");
});
