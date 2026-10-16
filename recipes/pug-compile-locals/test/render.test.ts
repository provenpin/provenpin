import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderInbox, renderComment, renderFile } from "../src/render.ts";

test("renders locals, mixins, conditionals and iteration", () => {
  const html = renderInbox({
    title: "Inbox",
    items: [
      { from: "Ada", subject: "Hello", unread: true },
      { from: "Linus", subject: "Patch", unread: false },
    ],
  });
  assert.match(html, /<h1>Inbox<\/h1>/);
  assert.match(html, /<ul class="inbox">/);
  const rows = html.match(/<li class="(unread|read)">/g) ?? [];
  assert.equal(rows.length, 2);
  assert.match(
    html,
    /<li class="unread"><strong>Ada<\/strong><span class="subject">Hello<\/span><\/li>/,
  );
  assert.match(
    html,
    /<li class="read"><strong>Linus<\/strong><span class="subject">Patch<\/span><\/li>/,
  );
});

test("mixin falls through to the else branch when empty", () => {
  const html = renderInbox({ title: "Inbox", items: [] });
  assert.match(html, /<p class="empty">No messages<\/p>/);
  assert.doesNotMatch(html, /<ul class="inbox">/);
});

test("compiled string escapes (=) but unescaped (!=) buffers raw output", () => {
  assert.equal(renderComment("<b>bold</b>", true), "<p>&lt;b&gt;bold&lt;/b&gt;</p>");
  assert.equal(renderComment("<b>bold</b>", false), "<p><b>bold</b></p>");
});

test("compileFile renders a temp .pug and distinguishes escaped from raw", () => {
  const dir = mkdtempSync(join(tmpdir(), "pug-recipe-"));
  const file = join(dir, "escape.pug");
  writeFileSync(
    file,
    [
      "doctype html",
      "html",
      "  body",
      "    p.safe= html",
      "    p.raw!= html",
      "",
    ].join("\n"),
    "utf8",
  );
  try {
    const out = renderFile(file, { html: "<b>bold</b>" });
    assert.match(out, /^<!DOCTYPE html>/);
    assert.match(out, /<p class="safe">&lt;b&gt;bold&lt;\/b&gt;<\/p>/);
    assert.match(out, /<p class="raw"><b>bold<\/b><\/p>/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
