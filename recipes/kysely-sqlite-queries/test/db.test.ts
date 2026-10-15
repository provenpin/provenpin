import { test } from "node:test";
import assert from "node:assert/strict";
import { createDb, addAuthorWithBooks, booksByAuthor } from "../src/db.ts";

test("transaction insert and join query", async () => {
  const db = await createDb();
  await addAuthorWithBooks(db, "Le Guin", ["The Dispossessed", "A Wizard of Earthsea"]);
  const rows = await booksByAuthor(db, "Le Guin");
  assert.deepEqual(rows.map((r) => r.title), ["A Wizard of Earthsea", "The Dispossessed"]);
  await db.destroy();
});
