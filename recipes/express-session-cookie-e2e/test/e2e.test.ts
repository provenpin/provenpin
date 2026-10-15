import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import makeFetchCookie from "fetch-cookie";
import { createApp } from "../src/app.ts";

let server: Server, base: string;
before(() => new Promise<void>((r) => { server = createApp("test-secret").listen(0, () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }));
after(() => new Promise<void>((r) => server.close(() => r())));

test("full browser-like flow: login, dashboard, logout", async () => {
  const jar = new makeFetchCookie.toughCookie.CookieJar();
  const f = makeFetchCookie(fetch, jar);
  assert.equal(await (await f(`${base}/dashboard`)).text(), "login page"); // redirect followed
  const login = await f(`${base}/login`, { method: "POST", body: new URLSearchParams({ username: "ada", password: "secret" }) });
  assert.equal(await login.text(), "Welcome ada");
  const cookie = (await jar.getCookies(base))[0];
  assert.equal(cookie.key, "sid");
  assert.equal(cookie.httpOnly, true);
  await f(`${base}/logout`, { method: "POST" });
  assert.equal(await (await f(`${base}/dashboard`)).text(), "login page");
});

test("bad password is 401 and sets no session", async () => {
  const jar = new makeFetchCookie.toughCookie.CookieJar();
  const f = makeFetchCookie(fetch, jar);
  const r = await f(`${base}/login`, { method: "POST", body: new URLSearchParams({ username: "x", password: "nope" }) });
  assert.equal(r.status, 401);
  assert.equal((await jar.getCookies(base)).length, 0);
});
