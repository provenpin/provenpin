import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createJar,
  deserializeJar,
  domainMatches,
  expireCookie,
  getCookiesForUrl,
  serializeJar,
  setCookie,
} from "../src/jar.ts";

test("sets and reads a cookie for a URL", async () => {
  const jar = createJar();
  await setCookie(jar, "https://example.com/", "session=abc123; Path=/");
  const cookies = await getCookiesForUrl(jar, "https://example.com/dashboard");
  assert.equal(cookies.length, 1);
  assert.equal(cookies[0]?.value, "abc123");
});

test("does not leak cookies across domains", async () => {
  const jar = createJar();
  await setCookie(jar, "https://example.com/", "session=abc123; Path=/");
  const cookies = await getCookiesForUrl(jar, "https://other.com/");
  assert.deepEqual(cookies, []);
});

test("rejects a cookie whose domain does not match the URL", async () => {
  const jar = createJar();
  await assert.rejects(
    setCookie(jar, "https://other.com/", "session=abc123; Domain=example.com; Path=/"),
  );
});

test("domainMatches is case insensitive and covers subdomains", () => {
  assert.equal(domainMatches("app.example.com", "example.com"), true);
  assert.equal(domainMatches("example.com", "example.com"), true);
  assert.equal(domainMatches("example.com", ".example.com"), true);
  assert.equal(domainMatches("notexample.com", "example.com"), false);
  assert.equal(domainMatches("badexample.com", "ample.com"), false);
  assert.equal(domainMatches("example.com", "other.com"), false);
  assert.equal(domainMatches("example.com", null), false);
});

test("round trips a jar through JSON", async () => {
  const jar = createJar();
  await setCookie(jar, "https://example.com/", "session=abc123; Path=/");
  const json = await serializeJar(jar);

  const restored = await deserializeJar(json);
  const cookies = await getCookiesForUrl(restored, "https://example.com/");
  assert.equal(cookies.length, 1);
  assert.equal(cookies[0]?.value, "abc123");
});

test("expiring a cookie removes it from the jar", async () => {
  const jar = createJar();
  await setCookie(jar, "https://example.com/", "session=abc123; Path=/");
  await expireCookie(jar, "https://example.com/", "session");
  const cookies = await getCookiesForUrl(jar, "https://example.com/");
  assert.deepEqual(cookies, []);
});
