import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getProperty,
  setProperty,
  hasProperty,
  deleteProperty,
  readPath,
} from "../src/paths.ts";

test("getProperty reads nested values", () => {
  const config = { a: { b: { c: 42 } } };
  assert.equal(getProperty(config, "a.b.c"), 42);
  assert.equal(getProperty(config, "a.b.missing"), undefined);
});

test("getProperty reads array index paths", () => {
  const data = { users: [{ name: "ada" }, { name: "grace" }] };
  assert.equal(getProperty(data, "users.1.name"), "grace");
});

test("getProperty reads keys with escaped dots", () => {
  const flat = { "a.b": { c: 7 } };
  assert.equal(getProperty(flat, "a\\.b.c"), 7);
  assert.equal(getProperty(flat, "a.b.c"), undefined);
});

test("setProperty creates nested objects", () => {
  const target: Record<string, unknown> = {};
  setProperty(target, "a.b.c", 1);
  assert.deepEqual(target, { a: { b: { c: 1 } } });
});

test("setProperty honours escaped dots", () => {
  const target: Record<string, unknown> = {};
  setProperty(target, "a\\.b.c", 2);
  assert.deepEqual(target, { "a.b": { c: 2 } });
});

test("hasProperty detects nested and escaped paths", () => {
  const obj = { a: { b: 1 }, "a.b": 2 };
  assert.equal(hasProperty(obj, "a.b"), true);
  assert.equal(hasProperty(obj, "a\\.b"), true);
  assert.equal(hasProperty(obj, "a.c"), false);
});

test("deleteProperty removes nested and escaped keys", () => {
  const obj: Record<string, unknown> = { a: { b: 1, c: 2 }, "a.b": 3 };
  assert.equal(deleteProperty(obj, "a.b"), true);
  assert.deepEqual(obj, { a: { c: 2 }, "a.b": 3 });
  assert.equal(deleteProperty(obj, "a\\.b"), true);
  assert.deepEqual(obj, { a: { c: 2 } });
});

test("readPath returns a fallback for missing paths", () => {
  const obj = { a: { b: 5 } };
  assert.equal(readPath(obj, "a.b", 0), 5);
  assert.equal(readPath(obj, "a.z", 99), 99);
});
