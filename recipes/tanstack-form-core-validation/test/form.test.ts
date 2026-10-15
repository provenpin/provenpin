import { test } from "node:test";
import assert from "node:assert/strict";
import { ageError, createSignupForm, emailError } from "../src/form.ts";

test("validators catch bad email and age", () => {
  assert.equal(emailError("not-an-email"), "email must include @");
  assert.equal(emailError("a@b.co"), undefined);
  assert.equal(ageError(16), "must be 18+");
  assert.equal(ageError(21), undefined);
});

test("form submits cleaned values", async () => {
  let submitted: { email: string; age: number } | undefined;
  const form = createSignupForm((v) => {
    submitted = v;
  });
  form.setFieldValue("email", "jp@example.com");
  form.setFieldValue("age", 30);
  await form.handleSubmit();
  assert.deepEqual(submitted, { email: "jp@example.com", age: 30 });
});
