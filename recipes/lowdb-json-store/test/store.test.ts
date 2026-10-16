import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  addComment,
  addPost,
  addUser,
  countComments,
  defaultData,
  getPost,
  getPostsByTag,
  getUserPosts,
  openMemoryStore,
  openStore,
} from "../src/store.ts";

async function withTempFile(fn: (file: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "lowdb-"));
  try {
    await fn(join(dir, "db.json"));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("seeds default data into a missing JSON file", async () => {
  await withTempFile(async (file) => {
    const store = await openStore(file);
    assert.deepEqual(store.data, defaultData);
    const raw = await readFile(file, "utf8");
    assert.deepEqual(JSON.parse(raw), defaultData);
  });
});

test("persists nested collections across reopen", async () => {
  await withTempFile(async (file) => {
    const store = await openStore(file);
    await addUser(store, { id: "u1", name: "Ada" });
    await addPost(store, {
      id: "p1",
      title: "Hello lowdb",
      authorId: "u1",
      tags: ["intro", "json"],
      comments: [],
    });
    await addComment(store, "p1", { id: "c1", postId: "p1", body: "nice" });
    await addComment(store, "p1", { id: "c2", postId: "p1", body: "agree" });

    const reopened = await openStore(file);
    const post = getPost(reopened, "p1");
    assert.ok(post);
    assert.deepEqual(post!.tags, ["intro", "json"]);
    assert.equal(countComments(reopened, "p1"), 2);
    assert.deepEqual(getUserPosts(reopened, "u1").map((p) => p.id), ["p1"]);
    assert.deepEqual(getPostsByTag(reopened, "json").map((p) => p.id), ["p1"]);
  });
});

test("supports direct data mutation followed by write()", async () => {
  await withTempFile(async (file) => {
    const store = await openStore(file);
    await addUser(store, { id: "u9", name: "Linus" });
    store.data.posts.push({
      id: "p9",
      title: "Manual write",
      authorId: "u9",
      tags: ["manual"],
      comments: [],
    });
    await store.write();

    const reopened = await openStore(file);
    assert.equal(getPost(reopened, "p9")?.title, "Manual write");
  });
});

test("Memory adapter keeps data in memory only", async () => {
  const store = await openMemoryStore();
  assert.deepEqual(store.data, defaultData);
  await addUser(store, { id: "u2", name: "Grace" });
  await addPost(store, {
    id: "p2",
    title: "Ephemeral",
    authorId: "u2",
    tags: ["memory"],
    comments: [],
  });
  assert.deepEqual(getUserPosts(store, "u2").map((p) => p.id), ["p2"]);
});

test("rejects writes that violate referential integrity", async () => {
  const store = await openMemoryStore();
  await assert.rejects(
    () =>
      addPost(store, {
        id: "p3",
        title: "orphan",
        authorId: "missing",
        tags: [],
        comments: [],
      }),
    /unknown author/,
  );
  assert.equal(store.data.posts.length, 0);
  await assert.rejects(
    () => addComment(store, "nope", { id: "c9", postId: "nope", body: "x" }),
    /unknown post/,
  );
});
