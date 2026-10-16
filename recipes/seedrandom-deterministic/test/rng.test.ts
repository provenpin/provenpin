import { test } from "node:test";
import assert from "node:assert/strict";
import { createRng, createAleaRng, take, withSeededMath } from "../src/rng.ts";

test("same seed produces identical sequences", () => {
  const a = take(createRng("alpha"), 5);
  const b = take(createRng("alpha"), 5);
  assert.equal(a.length, 5);
  assert.deepEqual(a, b);
  assert.ok(a.every((n) => n >= 0 && n < 1));
});

test("different seeds produce different sequences", () => {
  const a = take(createRng("alpha"), 5);
  const b = take(createRng("beta"), 5);
  assert.notDeepEqual(a, b);
});

test("alea generator is reproducible", () => {
  const a = take(createAleaRng("seed-1"), 4);
  const b = take(createAleaRng("seed-1"), 4);
  assert.deepEqual(a, b);
});

test("withSeededMath patches Math.random then restores it", () => {
  const original = Math.random;
  const samples = withSeededMath("shared", () => [
    Math.random(),
    Math.random(),
    Math.random(),
  ]);
  assert.equal(Math.random, original);
  assert.deepEqual(samples, take(createRng("shared"), 3));
});

test("withSeededMath restores Math.random even on error", () => {
  const original = Math.random;
  assert.throws(() =>
    withSeededMath("boom", () => {
      throw new Error("boom");
    })
  );
  assert.equal(Math.random, original);
});
