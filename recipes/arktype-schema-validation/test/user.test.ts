import { test } from "node:test";
import assert from "node:assert/strict";
import { CreateUser, Event, parseUser, User } from "../src/user.ts";
import { type } from "arktype";

test("accepts a valid user", () => {
  const r = parseUser({ email: "a@example.com", name: "Ada", age: 30, role: "admin" });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.data.name, "Ada");
});

test("rejects bad email with problems summary", () => {
  const r = parseUser({ email: "nope", name: "Ada", age: 30, role: "member" });
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.problems, /email/i);
});

test("CreateUser morph fills default age and role", () => {
  const out = CreateUser({ email: "b@example.com", name: "Bob" });
  assert.equal(out instanceof type.errors, false);
  if (!(out instanceof type.errors)) {
    assert.equal(out.age, 18);
    assert.equal(out.role, "member");
  }
});

test("discriminated Event union", () => {
  const ok = Event({ kind: "deleted", id: "1", reason: "spam" });
  assert.equal(ok instanceof type.errors, false);
  const bad = Event({ kind: "deleted", id: "1" });
  assert.equal(bad instanceof type.errors, true);
  const extra = Event({ kind: "created", id: "1", extra: true });
  assert.equal(extra instanceof type.errors, true);
});
