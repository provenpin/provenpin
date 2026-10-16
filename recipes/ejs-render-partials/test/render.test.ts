import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  renderString,
  renderTemplateFile,
  type PageLocals,
} from "../src/render.ts";

const locals: PageLocals = {
  title: "Home",
  subtitle: "New arrivals",
  items: ["a", "b"],
};

test("renders a string template with locals", () => {
  const html = renderString("<h1><%= locals.title %></h1>", locals);
  assert.equal(html, "<h1>Home</h1>");
});

test("includes a partial resolved from a temp dir", async () => {
  const root = await mkdtemp(join(tmpdir(), "ejs-partials-"));
  try {
    await mkdir(join(root, "partials"), { recursive: true });
    await writeFile(
      join(root, "page.ejs"),
      "<h1><%= locals.title %></h1>\n<%- include('partials/badge.ejs', { label: locals.subtitle }) %>",
      "utf8",
    );
    await writeFile(
      join(root, "partials", "badge.ejs"),
      '<span class="badge"><%= locals.label %></span>',
      "utf8",
    );

    const html = await renderTemplateFile(join(root, "page.ejs"), locals, root);
    assert.equal(
      html,
      '<h1>Home</h1>\n<span class="badge">New arrivals</span>',
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("throws ReferenceError for a missing local under strict mode", () => {
  assert.throws(
    () => renderString("<%= locals.title %><%= missingLocal %>", locals),
    ReferenceError,
  );
});
