import { test, before } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildValidators } from "../src/build.ts";

type Validator = ((data: unknown) => boolean) & { errors?: Array<{ instancePath: string; keyword: string }> | null };
let validateUser: Validator;
let validateQuery: Validator;
let code = "";

before(async () => {
  // Written inside the project so the generated module can resolve ajv runtime helpers if it needs them.
  const out = path.resolve("generated/validators.mjs");
  code = buildValidators(out);
  const mod = await import(pathToFileURL(out).href);
  validateUser = mod.validateUser;
  validateQuery = mod.validateQuery;
});

test("generated module is plain ESM without a schema compiler", () => {
  assert.match(code, /export const validateUser/);
  assert.match(code, /export const validateQuery/);
  assert.doesNotMatch(code, /new Ajv/);
});

test("valid data passes and gets defaults", () => {
  const user: Record<string, unknown> = { email: "ada@example.com", age: 36 };
  assert.equal(validateUser(user), true);
  assert.equal(user.plan, "free");
});

test("allErrors reports every problem", () => {
  assert.equal(validateUser({ email: "nope", age: -1, extra: true }), false);
  const keywords = validateUser.errors!.map((e) => e.keyword).sort();
  assert.deepEqual(keywords, ["additionalProperties", "minimum", "pattern"]);
});

test("coerces query string values", () => {
  const query: Record<string, unknown> = { page: "3" };
  assert.equal(validateQuery(query), true);
  assert.equal(query.page, 3);
  const empty: Record<string, unknown> = {};
  assert.equal(validateQuery(empty), true);
  assert.equal(empty.page, 1);
});
