import { test } from "node:test";
import assert from "node:assert/strict";
import { htmlToMarkdown } from "../src/convert.ts";

test("headings, emphasis, links and lists", () => {
  const md = htmlToMarkdown('<h1>Title</h1><h2>Sub</h2><p>Some <strong>bold</strong> and <em>soft</em> <a href="https://example.com">link</a>.</p><ul><li>one</li><li>two</li></ul>');
  assert.match(md, /^# Title$/m);
  assert.match(md, /^## Sub$/m);
  assert.match(md, /\*\*bold\*\*/);
  assert.match(md, /_soft_/);
  assert.match(md, /\[link\]\(https:\/\/example\.com\)/);
  assert.match(md, /^-\s+one$/m);
  assert.match(md, /^-\s+two$/m);
});

test("fenced code keeps the language from class names", () => {
  const md = htmlToMarkdown('<pre><code class="language-ts">const x = 1;\n</code></pre>');
  assert.equal(md, "```ts\nconst x = 1;\n```");
});

test("custom rules: strikethrough and figure; scripts removed", () => {
  const md = htmlToMarkdown('<p><del>old</del> new</p><script>evil()</script><figure><img src="/a.png" alt="alt"><figcaption>A chart</figcaption></figure>');
  assert.match(md, /~~old~~ new/);
  assert.match(md, /!\[A chart\]\(\/a\.png\)/);
  assert.doesNotMatch(md, /evil/);
});
