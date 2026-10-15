import { test } from "node:test";
import assert from "node:assert/strict";
import { createCaller } from "../src/router.ts";

test("public query", async () => {
  assert.equal(await createCaller({ userId: null }).hello({ name: "dev" }), "hello dev");
});
test("authed mutation", async () => {
  const note = await createCaller({ userId: "u1" }).addNote({ text: "hi" });
  assert.equal(note.owner, "u1");
});
test("unauthorized and invalid input", async () => {
  await assert.rejects(createCaller({ userId: null }).addNote({ text: "x" }), /UNAUTHORIZED/);
  await assert.rejects(createCaller({ userId: "u1" }).addNote({ text: "" }));
});
