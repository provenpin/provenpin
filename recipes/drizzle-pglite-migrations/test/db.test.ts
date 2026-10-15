import { test } from "node:test";
import assert from "node:assert/strict";
import { eq, sql } from "drizzle-orm";
import { freshDb, taggedWith, upsertAccount } from "../src/db.ts";
import { accounts } from "../src/schema.ts";

test("migrations create enum, array and jsonb columns", async () => {
  const db = await freshDb();
  const [a] = await db.insert(accounts).values({ email: "a@x.io", tags: ["beta", "eu"] }).returning();
  assert.equal(a.plan, "free");
  assert.deepEqual(a.settings, {});
  assert.equal((await taggedWith(db, "beta")).length, 1);
  assert.equal((await taggedWith(db, "us")).length, 0);
});

test("upsert merges jsonb and updates enum", async () => {
  const db = await freshDb();
  await upsertAccount(db, "b@x.io", "free", { theme: "dark" });
  const [row] = await upsertAccount(db, "b@x.io", "pro", { beta: true });
  assert.equal(row.plan, "pro");
  assert.deepEqual(row.settings, { theme: "dark", beta: true });
});

test("enum rejects unknown values", async () => {
  const db = await freshDb();
  await assert.rejects(db.execute(sql`insert into accounts (email, plan) values ('c@x.io', 'gold')`));
  assert.equal((await db.select().from(accounts).where(eq(accounts.email, "c@x.io"))).length, 0);
});
