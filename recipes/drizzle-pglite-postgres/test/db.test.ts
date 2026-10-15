import { test } from "node:test";
import assert from "node:assert/strict";
import { createDb, createUserWithPost, postsByEmail, users } from "../src/db.ts";

test("insert with returning and join", async () => {
  const { db, client } = await createDb();
  const u = await createUserWithPost(db, "ada@example.com", "Hello");
  assert.equal(u.id, 1);
  assert.ok(u.createdAt instanceof Date);
  assert.deepEqual(await postsByEmail(db, "ada@example.com"), [{ title: "Hello" }]);
  await client.close();
});

test("unique violation rolls back the transaction", async () => {
  const { db, client } = await createDb();
  await createUserWithPost(db, "a@example.com", "one");
  await assert.rejects(createUserWithPost(db, "a@example.com", "two"));
  assert.equal((await db.select().from(users)).length, 1);
  await client.close();
});
