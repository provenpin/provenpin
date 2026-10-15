import { test } from "node:test";
import assert from "node:assert/strict";
import { createStaticHandler } from "react-router";
import { routes } from "../src/routes.ts";

const handler = createStaticHandler(routes);

test("loader data for nested route", async () => {
  const ctx: any = await handler.query(new Request("http://app/notes/1"));
  assert.equal(ctx.statusCode, 200);
  const all = Object.values(ctx.loaderData) as any[];
  assert.ok(all.some((d) => d?.note?.title === "First"));
  assert.ok(all.some((d) => Array.isArray(d?.notes)));
});

test("missing note is a 404 error boundary", async () => {
  const ctx: any = await handler.query(new Request("http://app/notes/999"));
  assert.equal(ctx.statusCode, 404);
});

test("action redirects on success and returns 400 with errors", async () => {
  const ok = await handler.query(new Request("http://app/notes", { method: "POST", body: new URLSearchParams({ title: "Second" }) }));
  assert.ok(ok instanceof Response);
  assert.equal(ok.status, 302);
  assert.equal(ok.headers.get("location"), "/notes/2");
  const bad: any = await handler.query(new Request("http://app/notes", { method: "POST", body: new URLSearchParams({ title: " " }) }));
  assert.equal(bad.statusCode, 400);
  assert.deepEqual(Object.values(bad.actionData)[0], { errors: { title: ["Title required"] } });
});
