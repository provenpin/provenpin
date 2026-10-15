import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, createDb, createContext } from "../src/server.ts";

/** executeOperation runs the full request pipeline in-process, no HTTP server needed. */
async function exec(query: string, variables?: Record<string, unknown>, user?: string, db = createDb()) {
  const server = createServer();
  const res = await server.executeOperation({ query, variables }, { contextValue: createContext(db, user) });
  await server.stop();
  assert.equal(res.body.kind, "single");
  return { result: JSON.parse(JSON.stringify((res.body as { singleResult: unknown }).singleResult)) as { data?: any; errors?: any[] }, db };
}

test("resolves nested authors with one batched lookup instead of N+1", async () => {
  const { result, db } = await exec("{ books { title author { name } } }");
  assert.equal(result.errors, undefined);
  assert.equal(result.data.books.length, 4);
  assert.equal(result.data.books[1].author.name, "Octavia");
  assert.deepEqual(db.calls, [["a1", "a2", "a3"]]); // deduped and batched in one tick
});

test("author with books, and null for an unknown id", async () => {
  const { result } = await exec(`query($id: ID!) { a: author(id: $id) { name books { title } } b: author(id: "zz") { name } }`, { id: "a1" });
  assert.deepEqual(result.data.a.books.map((b: { title: string }) => b.title), ["The Dispossessed", "The Left Hand of Darkness"]);
  assert.equal(result.data.b, null);
});

test("mutation requires a user and reports error codes in extensions", async () => {
  const anon = await exec(`mutation { addBook(title: "X", authorId: "a1") { id } }`);
  assert.equal(anon.result.errors?.[0].extensions.code, "UNAUTHENTICATED");
  const bad = await exec(`mutation { addBook(title: "X", authorId: "nope") { id } }`, undefined, "ada");
  assert.equal(bad.result.errors?.[0].extensions.code, "BAD_USER_INPUT");
  assert.equal(bad.result.errors?.[0].extensions.field, "authorId");
});

test("mutation writes and clears the loader cache so reads see the new book", async () => {
  const db = createDb();
  const server = createServer();
  const contextValue = createContext(db, "ada");
  const read = `{ author(id: "a3") { books { title } } }`;
  const before = await server.executeOperation({ query: read }, { contextValue });
  const added = await server.executeOperation({ query: `mutation { addBook(title: "Excession", authorId: "a3") { id author { name } } }` }, { contextValue });
  const after = await server.executeOperation({ query: read }, { contextValue });
  await server.stop();
  // graphql-js builds results with null prototypes; a JSON round trip makes them plain objects
  const data = (r: typeof before) => JSON.parse(JSON.stringify((r.body as any).singleResult.data));
  assert.equal(data(before).author.books.length, 1);
  assert.deepEqual(data(added).addBook, { id: "b5", author: { name: "Iain" } });
  assert.deepEqual(data(after).author.books.map((b: { title: string }) => b.title), ["Consider Phlebas", "Excession"]);
});

test("validation errors come back as GRAPHQL_VALIDATION_FAILED", async () => {
  const { result } = await exec("{ books { isbn } }");
  assert.equal(result.errors?.[0].extensions.code, "GRAPHQL_VALIDATION_FAILED");
});
