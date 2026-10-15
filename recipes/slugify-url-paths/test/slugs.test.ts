import { test } from "node:test";
import assert from "node:assert/strict";
import { toSlug, uniqueSlug, productPath } from "../src/slugs.ts";

test("slugifies titles", () => {
  assert.equal(toSlug("Hello World!"), "hello-world");
  assert.equal(toSlug("  Café & Tea "), "cafe-and-tea");
});

test("uniqueSlug appends suffix", () => {
  const used = new Set<string>();
  assert.equal(uniqueSlug("Post", used), "post");
  assert.equal(uniqueSlug("Post", used), "post-2");
  assert.equal(uniqueSlug("Post", used), "post-3");
});

test("productPath joins segments", () => {
  assert.equal(productPath("Power Tools", "16V Drill"), "/power-tools/16v-drill");
});
