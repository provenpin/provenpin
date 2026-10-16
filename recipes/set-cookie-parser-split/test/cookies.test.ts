import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseOne,
  parseAll,
  parseJoined,
  splitCookiesString,
} from "../src/cookies.ts";

test("parses a single Set-Cookie header", () => {
  const cookie = parseOne("session=abc123; Path=/; HttpOnly; SameSite=Lax");
  assert.equal(cookie.name, "session");
  assert.equal(cookie.value, "abc123");
  assert.equal(cookie.path, "/");
  assert.equal(cookie.httpOnly, true);
  assert.equal(String(cookie.sameSite).toLowerCase(), "lax");
});

test("parses an array of Set-Cookie headers", () => {
  const cookies = parseAll([
    "session=abc123; Path=/; HttpOnly; SameSite=Strict",
    "theme=dark; Path=/app; Max-Age=3600",
  ]);
  assert.equal(cookies.length, 2);

  const session = cookies[0]!;
  assert.equal(session.name, "session");
  assert.equal(session.value, "abc123");
  assert.equal(session.path, "/");
  assert.equal(session.httpOnly, true);
  assert.equal(String(session.sameSite).toLowerCase(), "strict");

  const theme = cookies[1]!;
  assert.equal(theme.name, "theme");
  assert.equal(theme.value, "dark");
  assert.equal(theme.path, "/app");
  assert.equal(theme.httpOnly, undefined);
});

test("splits comma-joined Set-Cookie headers with Expires dates", () => {
  const joined =
    "id=1; Path=/; Expires=Wed, 21 Oct 2026 07:28:00 GMT, token=xyz; Path=/; HttpOnly; SameSite=None";

  const parts = splitCookiesString(joined);
  assert.equal(parts.length, 2);
  assert.equal(parts[0], "id=1; Path=/; Expires=Wed, 21 Oct 2026 07:28:00 GMT");

  const cookies = parseJoined(joined);
  assert.equal(cookies.length, 2);
  assert.equal(cookies[0]!.name, "id");
  assert.equal(cookies[0]!.value, "1");
  assert.equal(cookies[0]!.path, "/");
  assert.equal(cookies[1]!.name, "token");
  assert.equal(cookies[1]!.value, "xyz");
  assert.equal(cookies[1]!.path, "/");
  assert.equal(cookies[1]!.httpOnly, true);
  assert.equal(String(cookies[1]!.sameSite).toLowerCase(), "none");
});
