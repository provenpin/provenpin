import { test } from "node:test";
import assert from "node:assert/strict";
import { createDb, createUserWithPosts, User } from "../src/db.ts";

test("insertGraph and eager fetch", async () => {
  const knex = await createDb();
  await createUserWithPosts("ada@example.com", ["One", "Two"]);
  const user = await User.query().where("email", "ada@example.com").withGraphFetched("posts").first();
  assert.ok(user);
  assert.equal(user!.posts!.length, 2);
  assert.deepEqual(user!.posts!.map((p) => p.title).sort(), ["One", "Two"]);
  await knex.destroy();
});
