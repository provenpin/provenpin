import { test } from "node:test";
import assert from "node:assert/strict";
import { fieldErrors, validateUser } from "../src/validate.ts";

test("accepts a valid payload and strips extras", () => {
  const data: Record<string, unknown> = {
    email: "a@example.com",
    name: "Ada",
    age: "30",
    admin: true,
    id: "123e4567-e89b-12d3-a456-426614174000",
  };
  assert.equal(validateUser(data), true);
  assert.equal(data.admin, undefined);
  assert.equal(data.age, 30);
});

test("rejects bad email and missing name", () => {
  assert.equal(validateUser({ email: "nope" }), false);
  const errs = fieldErrors(validateUser.errors);
  assert.ok(errs.email || errs._);
  assert.ok(Object.keys(errs).length >= 1);
});
