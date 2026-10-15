import { test } from "node:test";
import assert from "node:assert/strict";
import { reset, yoga } from "../src/schema.ts";

async function gql(query: string, variables?: Record<string, unknown>) {
  const res = await yoga.fetch("http://local/graphql", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  return { status: res.status, body: await res.json() };
}

test("create and query posts", async () => {
  reset();
  const created = await gql(
    `mutation($title: String!, $published: Boolean!) { createPost(title: $title, published: $published) { id title published } }`,
    { title: "Hello", published: true },
  );
  assert.equal(created.status, 200);
  assert.equal(created.body.data.createPost.title, "Hello");
  const listed = await gql(`{ posts { id title } }`);
  assert.equal(listed.body.data.posts.length, 1);
  const one = await gql(`query($id: Int!) { post(id: $id) { title } }`, { id: 1 });
  assert.equal(one.body.data.post.title, "Hello");
});
