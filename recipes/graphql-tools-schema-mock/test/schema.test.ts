import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSchema, run } from "../src/schema.ts";

test("mocked query returns shape-correct data", async () => {
  const { schema } = buildSchema();
  const r = await run(schema, "{ courses(limit: 2) { id title hours tags instructor { name } } }");
  assert.equal(r.errors, undefined);
  assert.equal(r.data.courses.length, 2);
  for (const c of r.data.courses) {
    assert.equal(typeof c.title, "string");
    assert.ok(Number.isInteger(c.hours) && c.hours >= 1 && c.hours <= 100);
    assert.equal(c.tags.length, 2);
    assert.equal(c.instructor.name, "Phil Morin");
  }
  assert.deepEqual(r.data.courses.map((c: { id: string }) => c.id), ["c1", "c2"]);
});

test("mocks are deterministic for a seed", async () => {
  const q = "{ course(id: \"c1\") { title hours } }";
  const a = await run(buildSchema(7).schema, q);
  const b = await run(buildSchema(7).schema, q);
  assert.deepEqual(a.data, b.data);
});

test("store keeps entities consistent across queries", async () => {
  const { schema } = buildSchema();
  const first = await run(schema, '{ course(id: "c1") { title instructor { id } } }');
  const again = await run(schema, '{ courses(limit: 1) { title instructor { id } } }');
  assert.deepEqual(again.data.courses[0], first.data.course);
});

test("mutation writes to the mock store", async () => {
  const { schema, store } = buildSchema();
  const m = await run(schema, 'mutation($t: String!) { renameCourse(id: "c2", title: $t) { id title } }', { t: "CITS Orientation" });
  // graphql 17 returns null-prototype result objects, so spread before deepEqual
  assert.deepEqual({ ...m.data.renameCourse }, { id: "c2", title: "CITS Orientation" });
  assert.equal(store.get("Course", "c2", "title"), "CITS Orientation");
  const q = await run(schema, '{ course(id: "c2") { title } }');
  assert.equal(q.data.course.title, "CITS Orientation");
});

test("custom resolver can return null and validation errors still apply", async () => {
  const { schema } = buildSchema();
  assert.equal((await run(schema, '{ course(id: "x9") { id } }')).data.course, null);
  const bad = await run(schema, "{ courses { nope } }");
  assert.match(bad.errors![0].message, /Cannot query field "nope"/);
});
