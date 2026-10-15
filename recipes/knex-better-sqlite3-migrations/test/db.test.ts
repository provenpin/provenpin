import { test } from "node:test";
import assert from "node:assert/strict";
import { type Knex } from "knex";
import { createDb as open, seed, publishedCounts } from "../src/db.ts";

// Every test gets its own in-memory database; t.after destroys it even when an assertion fails,
// so a failing test never leaves the pool open and hangs the run.
function createDb(t: { after: (fn: () => Promise<void>) => void }): Knex {
  const k = open();
  t.after(() => k.destroy());
  return k;
}

test("migrate.latest applies every migration in order and records them", async (t) => {
  const k = createDb(t);
  const [batch, applied] = await k.migrate.latest();
  assert.equal(batch, 1);
  assert.deepEqual(applied, ["20261001_create_users", "20261008_create_posts", "20261012_users_add_role"]);
  assert.equal(await k.schema.hasColumn("users", "role"), true);
  assert.equal(await k.migrate.currentVersion(), "20261012");
});

test("rollback and down undo the schema step by step", async (t) => {
  const k = createDb(t);
  await k.migrate.latest();
  await k.migrate.down();
  assert.equal(await k.schema.hasColumn("users", "role"), false);
  await k.migrate.rollback(undefined, true); // all remaining
  assert.equal(await k.schema.hasTable("users"), false);
  const [done, pending] = await k.migrate.list();
  assert.equal(done.length, 0);
  assert.equal(pending.length, 3);
});

test("seeds in a transaction and queries with joins and aggregates", async (t) => {
  const k = createDb(t);
  await k.migrate.latest();
  await seed(k);
  const rows = await publishedCounts(k);
  assert.deepEqual(rows.map((r) => ({ ...r, published: Number(r.published) })), [{ name: "Ada", published: 1 }, { name: "Bob", published: 1 }]);
  const bob = await k("users").where({ email: "bob@example.test" }).first();
  assert.equal(bob.role, "member");
});

test("unique and foreign key constraints are enforced", async (t) => {
  const k = createDb(t);
  await k.migrate.latest();
  await seed(k);
  await assert.rejects(k("users").insert({ email: "ada@example.test", name: "Ada 2" }), /UNIQUE constraint failed/);
  await assert.rejects(k("posts").insert({ user_id: 999, title: "orphan" }), /FOREIGN KEY constraint failed/);
  await k("users").where({ name: "Ada" }).del();
  const left = await k("posts").count({ n: "*" }).first();
  assert.equal(Number(left?.n), 1); // ON DELETE CASCADE removed Ada's posts
});

test("a failing transaction leaves no rows behind", async (t) => {
  const k = createDb(t);
  await k.migrate.latest();
  await assert.rejects(k.transaction(async (trx) => {
    await trx("users").insert({ email: "x@example.test", name: "X" });
    await trx("users").insert({ email: "x@example.test", name: "dup" });
  }));
  assert.equal(Number((await k("users").count({ n: "*" }).first())?.n), 0);
});
