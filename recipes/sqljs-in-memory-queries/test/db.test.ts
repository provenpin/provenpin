import { test } from "node:test";
import assert from "node:assert/strict";
import { openNotesDb } from "../src/db.ts";

test("crud and roundtrip export", async () => {
  const db = await openNotesDb();
  const id = db.add("hello", "world");
  assert.equal(id, 1);
  assert.deepEqual(db.find(1), { id: 1, title: "hello", body: "world" });
  assert.equal(db.list().length, 1);
  const buf = db.export();
  db.close();

  const restored = await openNotesDb(buf);
  assert.equal(restored.list()[0].title, "hello");
  restored.close();
});
