import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "../src/db.ts";

test("create user with posts and query relation", async () => {
  const prisma = createClient();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  await prisma.user.create({ data: { email: "a@example.com", posts: { create: [{ title: "one" }, { title: "two" }] } } });
  const user = await prisma.user.findUnique({ where: { email: "a@example.com" }, include: { posts: true } });
  assert.equal(user?.posts.length, 2);
  await prisma.$disconnect();
});
