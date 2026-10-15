import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore, type Item } from "../src/store.ts";

let seq = 0;
function fresh() {
  return createStore(`provenpin-test-${seq++}`);
}

const seed: Item[] = [
  { sku: "A", category: "books", price: 12, createdAt: 1 },
  { sku: "B", category: "books", price: 30, createdAt: 2 },
  { sku: "C", category: "toys", price: 18, createdAt: 3 },
];

test("bulkAdd inserts rows and equals query filters by index", async () => {
  const db = fresh();
  const ids = await db.items.bulkAdd(seed, { allKeys: true });
  assert.equal(ids.length, 3);

  const books = await db.items.where("category").equals("books").toArray();
  assert.equal(books.length, 2);
  assert.deepEqual(
    books.map((b) => b.sku).sort(),
    ["A", "B"],
  );

  await db.delete();
});

test("between query returns an inclusive price range", async () => {
  const db = fresh();
  await db.items.bulkAdd(seed, { allKeys: true });

  const mid = await db.items.where("price").between(10, 20).toArray();
  assert.deepEqual(
    mid.map((i) => i.sku).sort(),
    ["A", "C"],
  );

  await db.delete();
});

test("compound index query matches category and price together", async () => {
  const db = fresh();
  await db.items.bulkAdd(seed, { allKeys: true });

  const hit = await db.items.where("[category+price]").equals(["books", 30]).first();
  assert.equal(hit?.sku, "B");

  const none = await db.items.where("[category+price]").equals(["toys", 30]).first();
  assert.equal(none, undefined);

  await db.delete();
});

test("update modifies matching rows in place", async () => {
  const db = fresh();
  await db.items.bulkAdd(seed, { allKeys: true });

  const updated = await db.items.where("sku").equals("A").modify({ price: 15 });
  assert.equal(updated, 1);

  const row = await db.items.where("sku").equals("A").first();
  assert.equal(row?.price, 15);

  await db.delete();
});

test("transaction rolls back when it throws", async () => {
  const db = fresh();
  await db.items.bulkAdd(seed, { allKeys: true });

  await assert.rejects(
    db.transaction("rw", db.items, async () => {
      await db.items.add({ sku: "X", category: "toys", price: 5, createdAt: 4 });
      assert.equal(await db.items.count(), 4);
      throw new Error("rollback-me");
    }),
    /rollback-me/,
  );

  assert.equal(await db.items.count(), 3);
  assert.equal(await db.items.where("sku").equals("X").first(), undefined);

  await db.delete();
});
