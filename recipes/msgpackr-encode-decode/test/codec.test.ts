import { test } from "node:test";
import assert from "node:assert/strict";
import { decode, encode } from "../src/codec.ts";

test("roundtrips nested payload", () => {
  const value = {
    id: 42,
    name: "widget",
    tags: ["a", "b"],
    meta: { ok: true, score: 9.5 },
  };
  const buf = encode(value);
  assert.ok(Buffer.isBuffer(buf));
  assert.deepEqual(decode(buf), value);
});

test("produces compact binary", () => {
  const buf = encode({ id: 1, name: "x", tags: [], meta: { ok: false, score: 0 } });
  assert.ok(buf.length < 64);
});
