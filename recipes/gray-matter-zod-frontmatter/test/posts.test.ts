import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePost, publishedSorted, writePost, FrontmatterError } from "../src/posts.ts";

const a = `---
title: Hello World
date: 2026-03-01
tags: [intro, news]
---
Short intro.
<!-- more -->
The rest.
`;
const b = `---
title: Draft Thing
date: 2026-04-01
draft: true
---
wip`;
const c = `---
title: Later Post
date: "2026-05-10T12:00:00Z"
slug: later
---
Body`;

test("parses, coerces dates, defaults and builds a slug", () => {
  const p = parsePost(a);
  assert.equal(p.title, "Hello World");
  assert.equal(p.slug, "hello-world");
  assert.ok(p.date instanceof Date);
  assert.equal(p.date.toISOString().slice(0, 10), "2026-03-01");
  assert.deepEqual(p.tags, ["intro", "news"]);
  assert.equal(p.draft, false);
  assert.equal(p.excerpt, "Short intro.");
});

test("filters drafts and sorts newest first", () => {
  assert.deepEqual(publishedSorted([a, b, c]).map((p) => p.slug), ["later", "hello-world"]);
});

test("invalid front matter throws a readable error", () => {
  assert.throws(() => parsePost("---\ndate: not-a-date\n---\nx"), (e: unknown) => {
    assert.ok(e instanceof FrontmatterError);
    assert.match((e as Error).message, /title/);
    assert.match((e as Error).message, /date/);
    return true;
  });
});

test("writePost round-trips through parsePost", () => {
  const src = writePost("Hi there", { title: "Round Trip", date: "2026-06-01", tags: ["x"] });
  assert.match(src, /^---\n/);
  const p = parsePost(src);
  assert.equal(p.title, "Round Trip");
  assert.equal(p.body, "Hi there");
  assert.deepEqual(p.tags, ["x"]);
});
