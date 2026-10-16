import { test } from "node:test";
import assert from "node:assert/strict";
import {
  charsetFor,
  contentTypeFor,
  extensionFromType,
  typeFromExtension,
} from "../src/mime.ts";

test("resolves content-type from common extensions", () => {
  assert.equal(typeFromExtension("json"), "application/json");
  assert.equal(typeFromExtension(".json"), "application/json");
  assert.equal(typeFromExtension("html"), "text/html");
  assert.equal(typeFromExtension(".png"), "image/png");
  assert.equal(typeFromExtension("wasm"), "application/wasm");
});

test("resolves extension from common types", () => {
  assert.equal(extensionFromType("application/json"), "json");
  assert.equal(extensionFromType("text/html"), "html");
  assert.equal(extensionFromType("image/png"), "png");
  assert.equal(extensionFromType("application/wasm"), "wasm");
});

test("builds a full content-type with charset", () => {
  assert.equal(contentTypeFor("json"), "application/json; charset=utf-8");
  assert.equal(contentTypeFor("html"), "text/html; charset=utf-8");
  assert.equal(charsetFor("text/html"), "UTF-8");
  assert.equal(charsetFor("application/json"), "UTF-8");
});

test("handles unknown input gracefully", () => {
  assert.equal(typeFromExtension("not-a-real-ext-xyz"), undefined);
  assert.equal(extensionFromType("application/x-not-a-real-type"), undefined);
  assert.equal(contentTypeFor("not-a-real-ext-xyz"), undefined);
  assert.equal(charsetFor("application/wasm"), undefined);
});

test("round trips a lookup back to its extension", () => {
  const type = typeFromExtension("wasm");
  assert.equal(type, "application/wasm");
  assert.equal(extensionFromType(type as string), "wasm");
});
