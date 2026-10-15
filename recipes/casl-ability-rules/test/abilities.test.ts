import { test } from "node:test";
import assert from "node:assert/strict";
import { createMongoAbility } from "@casl/ability";
import { asPost, defineAbilityFor, packAbility, type Post } from "../src/abilities.ts";

const owned: Post = { id: 1, authorId: 7, published: false };
const other: Post = { id: 2, authorId: 9, published: true };

test("admin can manage everything", () => {
  const a = defineAbilityFor({ id: 1, role: "admin" });
  assert.equal(a.can("delete", asPost(owned)), true);
  assert.equal(a.can("manage", "all"), true);
});

test("author updates only own posts", () => {
  const a = defineAbilityFor({ id: 7, role: "author" });
  assert.equal(a.can("update", asPost(owned)), true);
  assert.equal(a.can("update", asPost(other)), false);
  assert.equal(a.can("delete", asPost(owned)), false);
  assert.equal(a.can("create", "Post"), true);
});

test("guest reads only published and rules pack", () => {
  const a = defineAbilityFor({ id: 0, role: "guest" });
  assert.equal(a.can("read", asPost(other)), true);
  assert.equal(a.can("read", asPost(owned)), false);
  const packed = packAbility(a);
  const restored = createMongoAbility(packed);
  assert.equal(restored.can("read", asPost(other)), true);
});
