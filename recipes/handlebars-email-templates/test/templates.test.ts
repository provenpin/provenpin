import { test } from "node:test";
import assert from "node:assert/strict";
import { renderInvoice } from "../src/templates.ts";

test("renders invoice with partials and helpers", () => {
  const html = renderInvoice({
    brand: "ProvenPin",
    name: "Ada",
    premium: true,
    items: [
      { name: "Widget", qty: 2, price: 9.5 },
      { name: "Gadget", qty: 1, price: 4 },
    ],
  });
  assert.match(html, /<h1>ProvenPin<\/h1>/);
  assert.match(html, /Hello Ada/);
  assert.match(html, /premium/);
  assert.match(html, /Widget x2/);
  assert.match(html, /\$9\.50/);
  assert.match(html, /Total: \$23\.00/);
});

test("escapes HTML in names", () => {
  const html = renderInvoice({
    brand: "X",
    name: "<script>x</script>",
    premium: false,
    items: [],
  });
  assert.doesNotMatch(html, /<script>x<\/script>/);
  assert.match(html, /&lt;script&gt;/);
});
