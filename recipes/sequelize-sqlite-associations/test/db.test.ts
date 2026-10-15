import { test } from "node:test";
import assert from "node:assert/strict";
import { createAuthorWithPosts, createDb, postsForEmail, Post } from "../src/db.ts";

test("transaction creates user and posts with include", async () => {
  const db = await createDb();
  await createAuthorWithPosts("ada@example.com", ["First", "Second"]);
  const user = await postsForEmail("ada@example.com");
  assert.ok(user);
  assert.equal(user!.email, "ada@example.com");
  const posts = (user as any).posts as Post[];
  assert.deepEqual(posts.map((p) => p.title).sort(), ["First", "Second"]);
  await db.close();
});

test("rollback leaves no rows when nested create fails", async () => {
  const db = await createDb();
  await createAuthorWithPosts("bob@example.com", ["Ok"]);
  await assert.rejects(async () => {
    await Post.sequelize!.transaction(async (t) => {
      await Post.create({ title: "x", userId: 999 }, { transaction: t });
    });
  });
  assert.equal(await Post.count(), 1);
  await db.close();
});
