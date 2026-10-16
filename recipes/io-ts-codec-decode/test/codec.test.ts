import { test } from "node:test";
import assert from "node:assert/strict";
import { isLeft, isRight } from "fp-ts/Either";
import { decodeUser, encodeUser, explain, type User } from "../src/codec.ts";

const valid: User = {
  id: "u1",
  name: "Ada",
  role: "admin",
  tags: ["beta", "early"],
  meta: { age: 36 },
};

test("decodes valid unknown input", () => {
  const result = decodeUser(valid);
  assert.ok(isRight(result));
  if (isRight(result)) {
    assert.deepEqual(result.right, valid);
  }
});

test("treats partial fields as optional", () => {
  const result = decodeUser({ ...valid, meta: {} });
  assert.ok(isRight(result));
  if (isRight(result)) {
    assert.deepEqual(result.right.meta, {});
  }
});

test("rejects an unknown union member and reports the path", () => {
  const bad = { ...valid, role: "owner" };
  const result = decodeUser(bad);
  assert.ok(isLeft(result));
  assert.match(explain(bad).join("\n"), /role/);
});

test("rejects a non-positive branded age", () => {
  const bad = { ...valid, meta: { age: -1 } };
  const result = decodeUser(bad);
  assert.ok(isLeft(result));
  assert.match(explain(bad).join("\n"), /PositiveInt/);
});

test("rejects wrong element type inside an array", () => {
  const bad = { ...valid, tags: ["ok", 2] };
  const result = decodeUser(bad);
  assert.ok(isLeft(result));
  assert.match(explain(bad).join("\n"), /tags/);
});

test("encodes a valid value back to plain json", () => {
  assert.deepEqual(encodeUser(valid), valid);
});
