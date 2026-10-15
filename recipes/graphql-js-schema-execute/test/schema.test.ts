import { test } from "node:test";
import assert from "node:assert/strict";
import { graphql } from "graphql";
import { GraphQLDate, schema } from "../src/schema.ts";

// graphql 17 returns null-prototype objects; copy to plain objects before deepEqual.
const plain = (v: unknown) => JSON.parse(JSON.stringify(v));

test("executes a query with arguments and variables", async () => {
  const result = await graphql({
    schema,
    source: `query GetUser($id: String!) { user(id: $id) { id name createdAt } }`,
    variableValues: { id: "2" },
  });

  assert.equal(result.errors, undefined);
  assert.deepEqual(plain(result.data), {
    user: { id: "2", name: "Alan", createdAt: "2021-06-15T12:30:00.000Z" },
  });
});

test("returns validation errors for a bad query", async () => {
  const result = await graphql({ schema, source: `query { user { name } }` });

  assert.equal(result.data, undefined);
  const errors = result.errors;
  assert.ok(errors);
  assert.equal(errors.length, 1);
  assert.match(errors[0]!.message, /Query\.user\(id:\).*required/);
});

test("surfaces resolver errors in result.errors", async () => {
  const result = await graphql({ schema, source: `{ failing }` });

  assert.deepEqual(plain(result.data), { failing: null });
  const errors = result.errors;
  assert.ok(errors);
  assert.equal(errors.length, 1);
  assert.match(errors[0]!.message, /resolver exploded/);
});

test("custom Date scalar round-trips ISO strings", () => {
  const parsed = GraphQLDate.parseValue("2020-01-01T00:00:00.000Z");
  assert.ok(parsed instanceof Date);
  assert.equal(GraphQLDate.serialize(parsed), "2020-01-01T00:00:00.000Z");
  assert.throws(() => GraphQLDate.parseValue(42));
});
