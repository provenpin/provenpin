import { after, test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanupViews,
  createEta,
  createViewsDir,
  renderInline,
  renderLayout,
} from "../src/render.ts";

const views = createViewsDir();
const eta = createEta(views);

after(() => {
  cleanupViews(views);
});

test("renders a layout with a partial include", () => {
  const html = renderLayout(eta, { title: "Home", body: "<p>Welcome</p>" });
  assert.match(html, /<title>Home<\/title>/);
  assert.match(html, /<header><h1>Home<\/h1><\/header>/);
  assert.match(html, /<main><p>Welcome<\/p><\/main>/);
});

test("auto-escapes interpolated values in layout and partial", () => {
  const html = renderLayout(eta, { title: "Home <b> & co", body: "<p>ok</p>" });
  assert.match(html, /Home &lt;b/);
  assert.match(html, /&amp; co/);
  assert.doesNotMatch(html, /<b>/);
});

test("renderString escapes data", () => {
  const out = renderInline(eta, "<p><%= it.msg %></p>", { msg: "a & b < c" });
  assert.equal(out, "<p>a &amp; b &lt; c</p>");
});
