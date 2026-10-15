import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { userFactory, postFactory, resetData } from "../src/factories.ts";

beforeEach(() => resetData());

test("same seed produces identical data", () => {
  const first = userFactory.buildList(3);
  resetData();
  const second = userFactory.buildList(3);
  assert.deepEqual(first, second);
  assert.deepEqual(first.map((u) => u.id), [1, 2, 3]);
});

test("different seeds produce different data", () => {
  const a = userFactory.build();
  resetData(7);
  const b = userFactory.build();
  assert.notEqual(a.name, b.name);
});

test("params, traits and transient params", () => {
  const admin = userFactory.admin().build({ name: "Root User" }, { transient: { domain: "corp.test" } });
  assert.equal(admin.role, "admin");
  assert.equal(admin.name, "Root User");
  assert.match(admin.email, /@corp\.test$/);
  assert.ok(admin.createdAt < new Date("2026-01-01T00:00:00Z"));
});

test("associations reuse a given author", () => {
  const author = userFactory.build({ name: "Ada Lovelace" });
  const posts = postFactory.buildList(2, {}, { associations: { author } });
  // Fishery merges associations into a fresh object, so compare by value.
  assert.deepEqual(posts[0].author, author);
  assert.equal(posts[1].author.name, "Ada Lovelace");
  assert.equal(posts[0].tags.length, 2);
  assert.notEqual(posts[0].id, posts[1].id);
});
