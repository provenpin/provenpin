import { test } from "node:test";
import assert from "node:assert/strict";
import { generateTypes } from "../src/generate.ts";

test("generates a non-empty module from an inline spec", async () => {
  const source = await generateTypes();
  assert.equal(typeof source, "string");
  assert.ok(source.length > 0);
  assert.match(source, /export interface paths/);
});

test("includes each path key", async () => {
  const source = await generateTypes();
  assert.ok(source.includes('"/users":'));
  assert.ok(source.includes('"/users/{id}":'));
});

test("includes operation members for methods and operationIds", async () => {
  const source = await generateTypes();
  assert.match(source, /export interface operations/);
  assert.ok(source.includes("listUsers:"));
  assert.ok(source.includes("createUser:"));
  assert.ok(source.includes("getUser:"));
});

test("includes component schema interface members", async () => {
  const source = await generateTypes();
  assert.match(source, /export interface components/);
  assert.match(source, /User:\s*\{/);
  assert.match(source, /NewUser:\s*\{/);
  assert.ok(source.includes("id: string"));
  assert.ok(source.includes("name: string"));
});

test("includes path parameters, request body and response content", async () => {
  const source = await generateTypes();
  assert.match(source, /path:\s*\{/);
  assert.ok(source.includes("id: string"));
  assert.ok(source.includes("requestBody"));
  assert.ok(source.includes("content"));
});
