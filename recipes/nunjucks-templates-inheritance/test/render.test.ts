import { test } from "node:test";
import assert from "node:assert/strict";
import { renderInline, renderProfile, type User } from "../src/render.ts";

const user: User = {
  name: "Ada",
  role: "admin",
  bio: "Loves <b>math</b> & code",
};

test("child template extends the base and overrides its blocks", () => {
  const html = renderProfile(user);
  assert.ok(html.startsWith("<!doctype html>"));
  assert.match(html, /<title>Ada · profile<\/title>/);
  assert.match(html, /<h1>ADA<\/h1>/);
  assert.match(html, /<main>/);
});

test("macro imported from another template renders with its argument", () => {
  const html = renderProfile(user);
  assert.match(html, /<span class="badge badge--success">admin<\/span>/);
});

test("custom filter runs before autoescape", () => {
  const html = renderProfile(user);
  assert.match(html, /class="excerpt">\s*Loves &lt;b&gt;mat…/);
});

test("autoescape escapes html output by default", () => {
  const html = renderInline("{{ value }}", { value: "<b>hi</b>" });
  assert.equal(html, "&lt;b&gt;hi&lt;/b&gt;");
});

test("safe filter bypasses autoescaping", () => {
  const html = renderInline("{{ value | safe }}", { value: "<b>hi</b>" });
  assert.equal(html, "<b>hi</b>");
});
