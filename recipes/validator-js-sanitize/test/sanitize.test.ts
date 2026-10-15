import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanInput, scorePassword } from "../src/sanitize.ts";

test("validates and normalizes an email", () => {
  const result = cleanInput({ email: "  Alice@Example.COM  " });
  assert.equal(result.emailValid, true);
  assert.equal(result.email, "alice@example.com");
});

test("flags malformed emails", () => {
  const result = cleanInput({ email: "not-an-email" });
  assert.equal(result.emailValid, false);
});

test("validates URLs with protocol options", () => {
  assert.equal(cleanInput({ website: "https://example.com" }).websiteValid, true);
  assert.equal(cleanInput({ website: "ftp://example.com" }).websiteValid, false);
});

test("validates UUID v4 values", () => {
  assert.equal(
    cleanInput({ userId: "F47AC10B-58CC-4372-A567-0E02B2C3D479" }).userIdValid,
    true,
  );
  assert.equal(cleanInput({ userId: "nope" }).userIdValid, false);
});

test("scores strong passwords higher than weak ones", () => {
  const weak = scorePassword("password");
  const strong = scorePassword("Str0ng!Passw0rd");
  assert.equal(cleanInput({ password: "password" }).passwordStrong, false);
  assert.equal(cleanInput({ password: "Str0ng!Passw0rd" }).passwordStrong, true);
  assert.ok(strong > weak);
});

test("escapes and trims notes with sanitizers", () => {
  const result = cleanInput({ note: "  <b>hi & bye  " });
  assert.equal(result.note, "&lt;b&gt;hi &amp; bye");
});
