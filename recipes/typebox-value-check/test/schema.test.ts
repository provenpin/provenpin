import { test } from "node:test";
import assert from "node:assert/strict";
import { parseUser } from "../src/schema.ts";

test("accepts valid user", () => {
  const r = parseUser({ email: "a@example.com", name: "Ada", age: 30 });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.data.name, "Ada");
});

test("rejects extras and bad email", () => {
  assert.equal(parseUser({ email: "nope", name: "Ada" }).ok, false);
  assert.equal(parseUser({ email: "a@example.com", name: "Ada", admin: true }).ok, false);
});
