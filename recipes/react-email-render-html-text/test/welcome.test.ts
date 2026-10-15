import { test } from "node:test";
import assert from "node:assert/strict";
import { renderWelcome } from "../src/Welcome.tsx";

const props = {
  name: "Sam <script>",
  course: "CITS Orientation",
  startDate: "Nov 1st",
  url: "https://example.com/schedule?c=cits&x=1",
  items: [{ label: "Classroom", hours: 6 }, { label: "Field", hours: 2 }],
};

test("renders a full HTML email document", async () => {
  const { html } = await renderWelcome(props);
  assert.match(html, /^<!DOCTYPE html PUBLIC "-\/\/W3C\/\/DTD XHTML 1\.0 Transitional\/\/EN"/);
  assert.match(html, /<html dir="ltr" lang="en">/);
  // React SSR puts <!-- --> markers between adjacent text nodes
  assert.match(html, /Your class <strong>CITS Orientation<\/strong> starts <!-- -->Nov 1st<!-- -->\./);
  assert.match(html, /href="https:\/\/example\.com\/schedule\?c=cits&amp;x=1"/);
  assert.match(html, /background-color:#0b3d91/);
});

test("user input is escaped", async () => {
  const { html } = await renderWelcome(props);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /Sam &lt;script&gt;/);
});

test("preview text is a hidden preheader", async () => {
  const { html } = await renderWelcome(props);
  assert.match(html, /display:none[^>]*>You(&#x27;|')re enrolled in CITS Orientation/);
});

test("table layout for rows and columns", async () => {
  const { html } = await renderWelcome(props);
  assert.ok((html.match(/<table/g) ?? []).length >= 3);
  assert.match(html, /align="right"[^>]*>6<!-- --> h/);
});

test("plain text version", async () => {
  const { text } = await renderWelcome(props);
  assert.match(text, /WELCOME, SAM <SCRIPT>!/);
  assert.match(text, /Your class CITS Orientation starts Nov 1st\./);
  assert.match(text, /View schedule https:\/\/example\.com\/schedule\?c=cits&x=1/);
  assert.match(text, /^-{20,}$/m); // Hr becomes a dashed rule
  assert.doesNotMatch(text, /<table|<td/);
});
