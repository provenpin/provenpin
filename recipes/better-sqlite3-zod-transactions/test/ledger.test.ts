import { test } from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { openLedger, InsufficientFunds } from "../src/ledger.ts";

function setup() {
  const l = openLedger();
  l.open("alice", 10_00);
  l.open("bob", 0);
  return l;
}

test("a transfer moves money and writes two entries", () => {
  const l = setup();
  l.transfer({ from: "alice", to: "bob", cents: 250 });
  assert.equal(l.account("alice")?.balance_cents, 750);
  assert.equal(l.account("bob")?.balance_cents, 250);
  assert.equal(l.entryCount(), 2);
  l.close();
});

test("insufficient funds rolls back with no partial writes", () => {
  const l = setup();
  assert.throws(() => l.transfer({ from: "bob", to: "alice", cents: 1 }), InsufficientFunds);
  assert.equal(l.account("alice")?.balance_cents, 1000);
  assert.equal(l.entryCount(), 0);
  l.close();
});

test("zod rejects bad input before touching the database", () => {
  const l = setup();
  assert.throws(() => l.transfer({ from: "alice", to: "alice", cents: 5 }), ZodError);
  assert.throws(() => l.transfer({ from: "alice", to: "bob", cents: 1.5 }), ZodError);
  assert.equal(l.entryCount(), 0);
  l.close();
});

test("a failing item rolls back the whole batch", () => {
  const l = setup();
  assert.throws(() => l.batch([
    { from: "alice", to: "bob", cents: 400 },
    { from: "alice", to: "bob", cents: 400 },
    { from: "alice", to: "bob", cents: 400 },
  ]), InsufficientFunds);
  assert.equal(l.account("alice")?.balance_cents, 1000);
  assert.equal(l.account("bob")?.balance_cents, 0);
  assert.equal(l.entryCount(), 0);
  assert.equal(l.batch([{ from: "alice", to: "bob", cents: 100 }, { from: "bob", to: "alice", cents: 40 }]), 2);
  assert.equal(l.account("bob")?.balance_cents, 60);
  l.close();
});

test("the CHECK constraint is a last line of defence", () => {
  const l = setup();
  assert.throws(() => l.db.prepare("UPDATE accounts SET balance_cents = -1 WHERE id = 'bob'").run(), /CHECK constraint failed/);
  l.close();
});
