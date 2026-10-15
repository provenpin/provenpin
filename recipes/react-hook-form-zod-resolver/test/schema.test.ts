import { test } from "node:test";
import assert from "node:assert/strict";
import { signupResolver, SignupSchema } from "../src/schema.ts";

const run = (values: Record<string, unknown>) =>
  signupResolver(values as any, undefined, { fields: {}, shouldUseNativeValidation: false } as any);

test("valid values come back coerced", async () => {
  const r = await run({ email: "a@example.com", password: "longpass1", confirm: "longpass1", age: "30" });
  assert.deepEqual(r.errors, {});
  assert.equal((r.values as any).age, 30);
});

test("field and cross-field errors map to RHF errors", async () => {
  const r = await run({ email: "nope", password: "short", confirm: "other", age: "12" });
  assert.equal((r.errors as any).email.message, "Enter a valid email");
  assert.equal((r.errors as any).password.message, "At least 8 characters");
  assert.equal((r.errors as any).age.message, "Must be 18+");
});

test("refinement error lands on confirm", async () => {
  const r = await run({ email: "a@example.com", password: "longpass1", confirm: "longpass2", age: 20 });
  assert.equal((r.errors as any).confirm.message, "Passwords do not match");
});

test("same schema validates on the server", () => {
  assert.equal(SignupSchema.safeParse({ email: "a@example.com", password: "longpass1", confirm: "longpass1", age: 40 }).success, true);
});
