import { test } from "node:test";
import assert from "node:assert/strict";
import { blake3Hex, sha256Hex } from "../src/hash.ts";

test("sha256 matches known empty digest", () => {
  assert.equal(
    sha256Hex(""),
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  );
});

test("blake3 is deterministic and distinct from sha256", () => {
  const a = blake3Hex("provenpin");
  const b = blake3Hex("provenpin");
  assert.equal(a, b);
  assert.equal(a.length, 64);
  assert.notEqual(a, sha256Hex("provenpin"));
});
