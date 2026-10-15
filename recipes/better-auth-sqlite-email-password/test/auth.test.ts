import { test } from "node:test";
import assert from "node:assert/strict";
import { makeAuth } from "../src/auth.ts";

const creds = { email: "jp@example.com", password: "correct-horse-battery", name: "JP" };

test("sign up creates a user and a session", async () => {
  const auth = await makeAuth();
  const r = await auth.api.signUpEmail({ body: creds });
  assert.equal(r.user.email, "jp@example.com");
  assert.equal(r.user.name, "JP");
  assert.equal(r.user.emailVerified, false);
  assert.equal(typeof r.token, "string");
});

test("duplicate email and short password are rejected", async () => {
  const auth = await makeAuth();
  await auth.api.signUpEmail({ body: creds });
  await assert.rejects(auth.api.signUpEmail({ body: creds }), (e: { status?: string; statusCode?: number }) => e.statusCode === 422 || e.status === "UNPROCESSABLE_ENTITY");
  await assert.rejects(auth.api.signUpEmail({ body: { ...creds, email: "x@example.com", password: "short" } }), (e: { statusCode?: number }) => e.statusCode === 400);
});

test("sign in over HTTP returns a session cookie usable for getSession", async () => {
  const auth = await makeAuth();
  await auth.api.signUpEmail({ body: creds });
  const res = await auth.handler(new Request("http://localhost:3000/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000" },
    body: JSON.stringify({ email: creds.email, password: creds.password }),
  }));
  assert.equal(res.status, 200);
  const setCookie = res.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /better-auth\.session_token=/);
  assert.match(setCookie, /HttpOnly/i);
  const cookie = setCookie.split(";")[0];
  const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
  assert.equal(session?.user.email, creds.email);
});

test("wrong password is 401 and no session without cookie", async () => {
  const auth = await makeAuth();
  await auth.api.signUpEmail({ body: creds });
  const res = await auth.handler(new Request("http://localhost:3000/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:3000" },
    body: JSON.stringify({ email: creds.email, password: "wrong-password-123" }),
  }));
  assert.equal(res.status, 401);
  assert.equal(await auth.api.getSession({ headers: new Headers() }), null);
});

test("sign out revokes the session", async () => {
  const auth = await makeAuth();
  const { headers } = await auth.api.signUpEmail({ body: creds, returnHeaders: true });
  const cookie = (headers.get("set-cookie") ?? "").split(";")[0];
  const h = new Headers({ cookie });
  assert.ok(await auth.api.getSession({ headers: h }));
  await auth.api.signOut({ headers: h });
  assert.equal(await auth.api.getSession({ headers: h }), null);
});
