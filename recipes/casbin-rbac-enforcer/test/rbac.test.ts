import { test } from "node:test";
import assert from "node:assert/strict";
import { can, createEnforcer } from "../src/rbac.ts";

test("allows a direct policy match", async () => {
  const e = await createEnforcer();
  assert.equal(await can(e, "alice", "data1", "read"), true);
  assert.equal(await can(e, "alice", "data1", "write"), true);
});

test("denies when no policy matches", async () => {
  const e = await createEnforcer();
  assert.equal(await can(e, "alice", "data2", "read"), false);
  assert.equal(await can(e, "mallory", "data1", "read"), false);
});

test("resolves role inheritance for direct and nested roles", async () => {
  const e = await createEnforcer();
  assert.equal(await can(e, "bob", "data2", "write"), true);
  assert.equal(await can(e, "carol", "data2", "read"), true);
  assert.equal(await can(e, "dave", "data2", "read"), true);
  assert.equal(await can(e, "dave", "data2", "write"), true);
});

test("applies a deny rule that overrides an inherited allow", async () => {
  const e = await createEnforcer();
  assert.equal(await can(e, "eve", "data2", "read"), false);
  assert.equal(await can(e, "data_admin", "data2", "read"), true);
});

test("removes a policy at runtime and denies later requests", async () => {
  const e = await createEnforcer();
  assert.equal(await can(e, "alice", "data1", "write"), true);

  const removed = await e.removePolicy("alice", "data1", "write", "allow");
  assert.equal(removed, true);
  assert.equal(await can(e, "alice", "data1", "write"), false);
  assert.equal(await can(e, "alice", "data1", "read"), true);

  const again = await e.removePolicy("alice", "data1", "write", "allow");
  assert.equal(again, false);
});

test("removes a grouping policy at runtime and revokes inherited access", async () => {
  const e = await createEnforcer();
  assert.equal(await can(e, "bob", "data2", "read"), true);

  const removed = await e.removeGroupingPolicy("bob", "data_admin");
  assert.equal(removed, true);
  assert.equal(await can(e, "bob", "data2", "read"), false);
});

test("adds a policy at runtime and grants new access", async () => {
  const e = await createEnforcer();
  assert.equal(await can(e, "frank", "data3", "read"), false);

  const added = await e.addPolicy("frank", "data3", "read", "allow");
  assert.equal(added, true);
  assert.equal(await can(e, "frank", "data3", "read"), true);
});
