import { test } from "node:test";
import assert from "node:assert/strict";
import { extractInfo, rewrite } from "../src/page.ts";

const html = `<!doctype html>
<html><head>
  <title> Acme Parts </title>
  <meta name="description" content="Parts and tools">
  <meta property="og:title" content="Acme Parts">
  <meta property="og:image" content="https://cdn.example.com/og.png">
</head><body>
  <a href="/catalog">Catalog</a>
  <a href="about">About</a>
  <a href="https://other.example.org/x">Other</a>
  <a href="/catalog">Dup</a>
  <a href="mailto:hi@example.com">Mail</a>
  <img src="/img/bolt.png" alt="bolt">
  <script>track()</script>
  <script src="/app.js"></script>
</body></html>`;

test("extracts title, description, Open Graph and unique absolute links", () => {
  assert.deepEqual(extractInfo(html, "https://example.com/shop/"), {
    title: "Acme Parts",
    description: "Parts and tools",
    og: { title: "Acme Parts", image: "https://cdn.example.com/og.png" },
    links: ["https://example.com/catalog", "https://example.com/shop/about", "https://other.example.org/x"],
  });
});

test("rewrites URLs, lazy-loads images and removes inline scripts", () => {
  const out = rewrite(html, "https://example.com/shop/");
  assert.match(out, /<a href="https:\/\/example.com\/catalog">Catalog<\/a>/);
  // linkedom does not keep attribute order, so check each attribute on its own.
  const img = out.match(/<img [^>]+>/)![0];
  assert.match(img, /src="https:\/\/example.com\/img\/bolt.png"/);
  assert.match(img, /alt="bolt"/);
  assert.match(img, /loading="lazy"/);
  assert.doesNotMatch(out, /track\(\)/);
  assert.match(out, /<script src="\/app.js"><\/script>/);
  assert.match(out, /^<!DOCTYPE html>/i);
});
