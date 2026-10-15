import { test } from "node:test";
import assert from "node:assert/strict";
import * as v from "valibot";
import { Email, UserId, parseAccount } from "../src/schema.ts";

test("normalizes email", () => {
  assert.equal(v.parse(Email, "  Ada@Example.COM "), "ada@example.com");
});

test("brands user ids", () => {
  const id = v.parse(UserId, "usr_abc");
  assert.equal(id, "usr_abc");
  assert.throws(() => v.parse(UserId, "abc"));
});

test("parses account with defaults", () => {
  const r = parseAccount({ email: " A@B.co ", displayName: "  Ada  " });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.data.email, "a@b.co");
    assert.equal(r.data.displayName, "Ada");
    assert.equal(r.data.age, 18);
    assert.deepEqual(r.data.tags, []);
  }
});

test("reports issue paths", () => {
  const r = parseAccount({ email: "nope", displayName: "x" });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.ok(r.issues.some((i) => i.path === "email"));
    assert.ok(r.issues.some((i) => i.path === "displayName"));
  }
});
