import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize, valid, typeAhead, extract } from "../src/phone.ts";

test("normalizes US numbers to E.164 and formats", () => {
  const n = normalize("(907) 283-1234");
  assert.ok(n);
  assert.equal(n.e164, "+19072831234");
  assert.equal(n.national, "(907) 283-1234");
  assert.equal(n.international, "+1 907 283 1234");
  assert.equal(n.country, "US");
  assert.equal(n.uri, "tel:+19072831234");
});

test("international input ignores default country", () => {
  const n = normalize("+44 20 7946 0958", "US");
  assert.equal(n?.country, "GB");
  assert.equal(n?.e164, "+442079460958");
});

test("number type from max metadata", () => {
  assert.equal(normalize("+44 7400 123456")?.type, "MOBILE");
  assert.equal(normalize("+1 800 555 0199")?.type, "TOLL_FREE");
});

test("extensions are kept", () => {
  assert.equal(normalize("907-283-1234 ext. 42")?.ext, "42");
});

test("invalid numbers are rejected", () => {
  assert.equal(normalize("123"), null);
  assert.equal(valid("+1 555 0100"), false);
  assert.equal(valid("+1 907 283 1234"), true);
});

test("as-you-type formatting", () => {
  assert.equal(typeAhead("907283", "US"), "(907) 283");
  assert.equal(typeAhead("9072831234", "US"), "(907) 283-1234");
});

test("finds numbers in free text", () => {
  assert.deepEqual(extract("Call 907.283.1234 or +44 20 7946 0958 today"), ["+19072831234", "+442079460958"]);
});
