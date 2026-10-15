import { test } from "node:test";
import assert from "node:assert/strict";
import { makeDb, addCourse, enroll, enrollOneByOneInTransaction, roster } from "../src/db.ts";

test("insert with returning, serial ids and default now()", async () => {
  const { db } = makeDb();
  const a = await addCourse(db, "cits", "CITS Orientation", 8);
  const b = await addCourse(db, "rigging", "Rigging", 16);
  assert.equal(a.id, 1);
  assert.equal(b.id, 2);
  assert.equal(new Date(a.created_at).toISOString(), "2026-10-15T20:00:00.000Z");
  await db.destroy();
});

test("constraints: unique and check", async () => {
  const { db } = makeDb();
  await addCourse(db, "cits", "CITS", 8);
  await assert.rejects(addCourse(db, "cits", "dup", 8), /duplicate key|unique/i);
  await assert.rejects(addCourse(db, "long", "Too long", 200), /check/i);
  await db.destroy();
});

test("multi-row insert is atomic: a duplicate rejects the whole batch", async () => {
  const { db } = makeDb();
  await addCourse(db, "cits", "CITS", 8);
  await assert.rejects(enroll(db, "cits", ["a@x.com", "b@x.com", "a@x.com"]), /duplicate key|unique/i);
  assert.deepEqual(await roster(db), [{ slug: "cits", students: 0 }]);
  assert.equal(await enroll(db, "cits", ["a@x.com", "b@x.com"]), 2);
  assert.deepEqual(await roster(db), [{ slug: "cits", students: 2 }]);
  await db.destroy();
});

test("pg-mem gotcha: Kysely transaction errors propagate but earlier statements are not rolled back", async () => {
  const { db, mem } = makeDb();
  await addCourse(db, "cits", "CITS", 8);
  const snap = mem.backup();
  await assert.rejects(enrollOneByOneInTransaction(db, "cits", ["a@x.com", "a@x.com"]), /duplicate key|unique/i);
  // On real Postgres this would be 0. pg-mem keeps the first row, so restore a snapshot instead.
  assert.deepEqual(await roster(db), [{ slug: "cits", students: 1 }]);
  snap.restore();
  assert.deepEqual(await roster(db), [{ slug: "cits", students: 0 }]);
  await db.destroy();
});

test("foreign keys enforced and left join aggregates", async () => {
  const { db } = makeDb();
  await addCourse(db, "cits", "CITS", 8);
  await addCourse(db, "forklift", "Forklift", 4);
  await enroll(db, "forklift", ["c@x.com"]);
  await assert.rejects(db.insertInto("enrollments").values({ course_id: 99, email: "z@x.com" }).execute(), /foreign key/i);
  assert.deepEqual(await roster(db), [{ slug: "cits", students: 0 }, { slug: "forklift", students: 1 }]);
  await db.destroy();
});

test("backup and restore snapshots for fast test isolation", async () => {
  const { db, mem } = makeDb();
  await addCourse(db, "cits", "CITS", 8);
  const snap = mem.backup();
  await addCourse(db, "extra", "Extra", 2);
  snap.restore();
  assert.deepEqual((await roster(db)).map((r) => r.slug), ["cits"]);
  await db.destroy();
});
