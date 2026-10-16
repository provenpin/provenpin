import { test } from "node:test";
import assert from "node:assert/strict";
import {
  toPlural,
  toSingular,
  isPlural,
  isSingular,
  withCount,
} from "../src/nouns.ts";

test("pluralizes regular nouns", () => {
  assert.equal(toPlural("cat"), "cats");
  assert.equal(toPlural("dog"), "dogs");
  assert.equal(toPlural("box"), "boxes");
});

test("singularizes regular nouns", () => {
  assert.equal(toSingular("cats"), "cat");
  assert.equal(toSingular("boxes"), "box");
});

test("handles irregular nouns", () => {
  assert.equal(toPlural("child"), "children");
  assert.equal(toPlural("mouse"), "mice");
  assert.equal(toPlural("person"), "people");
  assert.equal(toSingular("children"), "child");
  assert.equal(toSingular("mice"), "mouse");
});

test("classifies plural and singular forms", () => {
  assert.equal(isPlural("cats"), true);
  assert.equal(isSingular("cats"), false);
  assert.equal(isSingular("cat"), true);
  assert.equal(isPlural("cat"), false);
});

test("applies a custom irregular rule", () => {
  assert.equal(toPlural("flarp"), "flarpen");
  assert.equal(toSingular("flarpen"), "flarp");
  assert.equal(isPlural("flarpen"), true);
});

test("applies a custom plural rule", () => {
  assert.equal(toPlural("blorf"), "blorfen");
});

test("pluralizes according to count including 0 and 1", () => {
  assert.equal(withCount("cat", 0), "0 cats");
  assert.equal(withCount("cat", 1), "1 cat");
  assert.equal(withCount("cat", 2), "2 cats");
  assert.equal(withCount("mouse", 1), "1 mouse");
});
