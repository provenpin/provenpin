import { test } from "node:test";
import assert from "node:assert/strict";
import { TRPCError } from "@trpc/server";
import { createCaller } from "../src/router.ts";

const anon = createCaller({ user: null });
const ada = createCaller({ user: { id: "ada", role: "user" } });
const root = createCaller({ user: { id: "root", role: "admin" } });
const code = (c: string) => (e: unknown) => e instanceof TRPCError && e.code === c;

test("public works without a user", async () => {
  assert.equal(await anon.health(), "ok");
});

test("protected requires a user", async () => {
  await assert.rejects(anon.addNote({ text: "x" }), code("UNAUTHORIZED"));
  const n = await ada.addNote({ text: "hi" });
  assert.equal(n.owner, "ada");
  assert.equal((await ada.myNotes()).length, 1);
});

test("zod input errors become BAD_REQUEST", async () => {
  await assert.rejects(ada.addNote({ text: "" }), code("BAD_REQUEST"));
});

test("admin-only procedure", async () => {
  await assert.rejects(ada.allNotes(), code("FORBIDDEN"));
  assert.ok(Array.isArray(await root.allNotes()));
});
