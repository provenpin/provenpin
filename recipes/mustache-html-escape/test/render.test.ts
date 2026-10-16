import { test } from "node:test";
import assert from "node:assert/strict";
import {
  renderOrder,
  renderEscaped,
  renderTriple,
  renderAmpersand,
  type OrderView,
} from "../src/render.ts";

const view: OrderView = {
  customer: "Ada",
  items: [
    { name: "Widget", qty: 2, parts: [{ label: "bolt" }, { label: "nut" }] },
    { name: "Gadget", qty: 1, parts: [] },
  ],
  comments: ["first", "second"],
};

test("renders nested sections and a partial", () => {
  const out = renderOrder(view);
  assert.match(out, /Hi Ada,/);
  assert.match(out, /- Widget x2/);
  assert.match(out, / {2}\* bolt/);
  assert.match(out, / {2}\* nut/);
  assert.match(out, /- Gadget x1/);
  assert.match(out, /-- Ada/);
});

test("inverted sections render for empty collections", () => {
  const out = renderOrder({ customer: "Ada", items: [], comments: [] });
  assert.match(out, /No items\./);
  assert.match(out, /No comments\./);
});

test("escapes user content by default", () => {
  const value = "<script>alert('x')</script>";
  assert.equal(
    renderEscaped(value),
    "&lt;script&gt;alert(&#39;x&#39;)&lt;&#x2F;script&gt;",
  );
});

test("triple and ampersand allow unescaped output", () => {
  const value = "<b>bold</b> & <i>italic</i>";
  assert.equal(renderTriple(value), value);
  assert.equal(renderAmpersand(value), value);
});
