import { test } from "node:test";
import assert from "node:assert/strict";
import { addAuthorWithBooks, createOrm, listBooks } from "../src/db.ts";

test("persists author books and populates", async () => {
  const orm = await createOrm();
  await addAuthorWithBooks(orm, "ada@example.com", ["Dispossessed", "Earthsea"]);
  assert.deepEqual(await listBooks(orm, "ada@example.com"), ["Dispossessed", "Earthsea"]);
  await orm.close();
});
