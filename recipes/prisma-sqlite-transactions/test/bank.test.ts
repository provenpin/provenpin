import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { createClient, openAccount, transfer, EmailTaken } from "../src/bank.ts";

const db = createClient();
beforeEach(async () => { await db.entry.deleteMany(); await db.account.deleteMany(); });
after(() => db.$disconnect());
const bal = async (email: string) => (await db.account.findUniqueOrThrow({ where: { email } })).balance;

test("nested create", async () => {
  const a = await openAccount(db, "a@x.io", 100);
  assert.equal(a.entries.length, 1);
});

test("duplicate email maps P2002 to a domain error", async () => {
  await openAccount(db, "a@x.io", 1);
  await assert.rejects(openAccount(db, "a@x.io", 1), EmailTaken);
});

test("transfer commits both sides", async () => {
  await openAccount(db, "a@x.io", 100); await openAccount(db, "b@x.io", 0);
  await transfer(db, "a@x.io", "b@x.io", 40);
  assert.deepEqual([await bal("a@x.io"), await bal("b@x.io")], [60, 40]);
});

test("failed transfer rolls back", async () => {
  await openAccount(db, "a@x.io", 10); await openAccount(db, "b@x.io", 0);
  await assert.rejects(transfer(db, "a@x.io", "b@x.io", 50), /insufficient/);
  assert.deepEqual([await bal("a@x.io"), await bal("b@x.io")], [10, 0]);
  assert.equal(await db.entry.count(), 2);
});
