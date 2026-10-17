import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { evaluateMdx, type MdxComponent } from "../src/render.ts";

function Greeting({ name }: { name: string }) {
  return createElement("p", { className: "greeting" }, `Hello, ${name}!`);
}

const mdx = [
  "# Hello MDX",
  "",
  "export const answer = 42;",
  "",
  '<Greeting name="World" />',
  "",
  "The answer is {answer}.",
].join("\n");

test("evaluates frontmatter-free MDX and renders static HTML", async () => {
  const { Content, exports } = await evaluateMdx(mdx);

  const html = renderToStaticMarkup(
    createElement(Content, { components: { Greeting: Greeting as MdxComponent } }),
  );

  assert.match(html, /<h1>Hello MDX<\/h1>/);
  assert.match(html, /<p class="greeting">Hello, World!<\/p>/);
  assert.match(html, /<p>The answer is 42\.<\/p>/);
  assert.equal(exports.answer, 42);
});
