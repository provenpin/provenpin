import { test } from "node:test";
import assert from "node:assert/strict";
import iconv from "iconv-lite";
import { decode, encode, roundTrip, supports } from "../src/codec.ts";

test("encodingExists reports known and unknown encodings", () => {
  assert.equal(supports("win1252"), true);
  assert.equal(supports("shift_jis"), true);
  assert.equal(supports("utf16le"), true);
  assert.equal(iconv.encodingExists("definitely-not-real"), false);
});

test("encodes win1252 to exact bytes", () => {
  const buffer = encode("café", "win1252");
  assert.deepEqual([...buffer], [0x63, 0x61, 0x66, 0xe9]);
});

test("decodes win1252 bytes back to text", () => {
  const text = decode(Buffer.from([0x63, 0x61, 0x66, 0xe9]), "win1252");
  assert.equal(text, "café");
});

test("encodes shift_jis to exact bytes", () => {
  const buffer = encode("日本語", "shift_jis");
  assert.deepEqual([...buffer], [0x93, 0xfa, 0x96, 0x7b, 0x8c, 0xea]);
});

test("decodes shift_jis bytes back to text", () => {
  const bytes = Buffer.from([0x93, 0xfa, 0x96, 0x7b, 0x8c, 0xea]);
  assert.equal(decode(bytes, "shift_jis"), "日本語");
});

test("encodes utf16le to exact bytes", () => {
  const buffer = encode("Hi", "utf16le");
  assert.deepEqual([...buffer], [0x48, 0x00, 0x69, 0x00]);
});

test("decodes utf16le bytes back to text", () => {
  const bytes = Buffer.from([0x48, 0x00, 0x69, 0x00]);
  assert.equal(decode(bytes, "utf16le"), "Hi");
});

test("round trips each supported encoding", () => {
  assert.equal(roundTrip("café", "win1252"), "café");
  assert.equal(roundTrip("日本語", "shift_jis"), "日本語");
  assert.equal(roundTrip("Hi", "utf16le"), "Hi");
});
