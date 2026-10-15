import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { NextRequest } from "next/server";

// Local mock of the Supabase Auth API so the test runs offline.
let server: http.Server;
before(async () => {
  server = http.createServer((req, res) => {
    const auth = req.headers.authorization ?? "";
    res.setHeader("content-type", "application/json");
    if (req.url?.startsWith("/auth/v1/user") && auth === "Bearer good-token") {
      res.end(JSON.stringify({ id: "u1", aud: "authenticated", email: "a@example.com", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" }));
    } else { res.statusCode = 401; res.end(JSON.stringify({ code: 401, msg: "invalid JWT" })); }
  });
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as any).port;
  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${port}`;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
});
after(() => server.close());

const { middleware } = await import("../middleware.ts");

function sessionCookie(token: string) {
  const session = { access_token: token, refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: "u1" } };
  return "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
}

test("signed-out user is redirected from /dashboard", async () => {
  const res = await middleware(new NextRequest("http://localhost/dashboard"));
  assert.equal(res.status, 307);
  assert.match(res.headers.get("location")!, /\/login$/);
});
test("public pages pass through when signed out", async () => {
  const res = await middleware(new NextRequest("http://localhost/"));
  assert.equal(res.status, 200);
});
test("signed-in user reaches /dashboard", async () => {
  const req = new NextRequest("http://localhost/dashboard", { headers: { cookie: `sb-127-auth-token=${sessionCookie("good-token")}` } });
  const res = await middleware(req);
  assert.equal(res.status, 200);
});
