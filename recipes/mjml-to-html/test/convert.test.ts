import { test } from "node:test";
import assert from "node:assert/strict";
import { render } from "../src/convert.ts";

const TEMPLATE = `
<mjml>
  <mj-body>
    <mj-section background-color="#f0f0f0">
      <mj-column>
        <mj-text font-size="20px" color="#333333">Hello MJML</mj-text>
        <mj-button href="https://example.com" background-color="#ff5500">Click me</mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

test("renders mjml to html with expected text", async () => {
  const { html, errors } = await render(TEMPLATE);
  assert.deepEqual(errors, []);
  assert.match(html, /Hello MJML/);
  assert.match(html, /Click me/);
  assert.match(html, /https:\/\/example\.com/);
});

test("inlines styles derived from mjml attributes", async () => {
  const { html } = await render(TEMPLATE);
  assert.match(html, /20px/);
  assert.match(html, /#333333|#333/i);
  assert.match(html, /#ff5500|#f50/i);
  assert.match(html, /background(-color)?/i);
});

test("reports validation errors for broken markup in soft mode", async () => {
  const broken = `<mjml><mj-body><mj-text>no column</mj-text></mj-body></mjml>`;
  const { html, errors } = await render(broken);
  assert.ok(errors.length > 0, "expected validation errors");
  assert.ok(errors.some((error) => error.message.length > 0));
  assert.equal(typeof html, "string");
});
