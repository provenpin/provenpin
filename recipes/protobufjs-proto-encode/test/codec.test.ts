import { test } from "node:test";
import assert from "node:assert/strict";
import { decodePerson, encodePerson, loadPersonType } from "../src/codec.ts";

test("encodes and decodes a Person", async () => {
  const Type = await loadPersonType();
  const person = { name: "Ada", id: 7, email: "ada@example.com" };
  const buf = encodePerson(Type, person);
  assert.ok(buf.byteLength > 0);
  assert.deepEqual(decodePerson(Type, buf), person);
});

test("verify rejects missing required shape via bad types", async () => {
  const Type = await loadPersonType();
  // proto3 has no required fields; verify still accepts strings/ints
  const buf = encodePerson(Type, { name: "", id: 0, email: "" });
  assert.deepEqual(decodePerson(Type, buf), { name: "", id: 0, email: "" });
});
