import { test } from "node:test";
import assert from "node:assert/strict";
import { yoga } from "../src/yoga.ts";

async function gql(query: string, user?: string, variables?: object) {
  const res = await yoga.fetch("http://yoga/graphql", { method: "POST", headers: { "content-type": "application/json", ...(user ? { "x-user-id": user } : {}) }, body: JSON.stringify({ query, variables }) });
  return res.json();
}

test("public query", async () => {
  assert.deepEqual((await gql("{ books { title } }")).data.books[0], { title: "SICP" });
});

test("auth error carries a code", async () => {
  const r = await gql("{ myBooks { id } }");
  assert.equal(r.errors[0].extensions.code, "UNAUTHENTICATED");
});

test("mutation with variables and context", async () => {
  const r = await gql("mutation($t: String!) { addBook(title: $t) { id title } }", "bob", { t: "TAOCP" });
  assert.equal(r.data.addBook.title, "TAOCP");
  assert.equal((await gql("{ myBooks { title } }", "bob")).data.myBooks.length, 1);
});

test("validation errors for bad queries", async () => {
  assert.ok((await gql("{ nope }")).errors.length);
});
