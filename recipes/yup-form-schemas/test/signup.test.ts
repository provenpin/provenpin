import { test } from "node:test";
import assert from "node:assert/strict";
import { signupSchema, validateSignup } from "../src/signup.ts";

const base = { email: " Ada@Example.com ", password: "s3cretpass", confirmPassword: "s3cretpass" };

test("personal signup applies transforms and defaults and strips company", async () => {
  const r = await validateSignup({ ...base, company: "ignored", age: "" , extra: 1 });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(r.value, { email: "ada@example.com", password: "s3cretpass", confirmPassword: "s3cretpass", accountType: "personal", tags: [] });
});

test("business accounts require a company", async () => {
  const r = await validateSignup({ ...base, accountType: "business" });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.deepEqual(r.errors.company, ["company is required for business accounts"]);
});

test("collects all errors per field", async () => {
  const r = await validateSignup({ email: "x", password: "short", confirmPassword: "other", age: 12, tags: ["a", "b", "c", "d"] });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.deepEqual(Object.keys(r.errors).sort(), ["age", "confirmPassword", "email", "password", "tags"]);
  assert.deepEqual(r.errors.confirmPassword, ["passwords must match"]);
});

test("isValidSync and cast work without async", () => {
  assert.equal(signupSchema.isValidSync({ ...base, age: 30 }), true);
  const cast = signupSchema.cast({ ...base, age: "42" });
  assert.equal(cast.age, 42);
});
