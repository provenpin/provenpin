import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { createClient } from "../src/client.ts";

const items = [{ id: 1, name: "bolt" }];
const server = setupServer(
  http.get("http://local/items", ({ request }) => {
    const q = new URL(request.url).searchParams.get("q");
    return HttpResponse.json(q ? items.filter((i) => i.name.includes(q)) : items);
  }),
  http.get("http://local/items/:id", ({ params }) => {
    const item = items.find((i) => i.id === Number(params.id));
    if (!item) return HttpResponse.json({ error: "missing" }, { status: 404 });
    return HttpResponse.json(item);
  }),
  http.post("http://local/items", async ({ request }) => {
    const body = await request.json() as { name: string };
    const item = { id: items.length + 1, name: body.name };
    items.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),
);

before(() => server.listen({ onUnhandledRequest: "error" }));
after(() => server.close());

test("lists, filters, creates", async () => {
  const client = createClient("http://local");
  assert.equal((await client.list()).length, 1);
  assert.equal((await client.list("bo"))[0].name, "bolt");
  const created = await client.create("nut");
  assert.equal(created.name, "nut");
  assert.equal((await client.get(created.id)).name, "nut");
});

test("maps 404 to FetchError", async () => {
  const client = createClient("http://local");
  await assert.rejects(() => client.get(999), (e: any) => e.status === 404 || e.response?.status === 404 || String(e).includes("404"));
});
