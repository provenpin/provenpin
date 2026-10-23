import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { createApi } from "../src/client.ts";

const items = [{ id: 1, name: "bolt" }];
const server = setupServer(
  http.get("http://local/items", ({ request }) => {
    const q = new URL(request.url).searchParams.get("q");
    return HttpResponse.json(q ? items.filter((i) => i.name.includes(q)) : items);
  }),
  http.post("http://local/items", async ({ request }) => {
    const body = (await request.json()) as { name: string };
    const item = { id: items.length + 1, name: body.name };
    items.push(item);
    return HttpResponse.json(item, { status: 201 });
  }),
  http.get("http://local/items/:id", ({ params }) => {
    const item = items.find((i) => i.id === Number(params.id));
    if (!item) return HttpResponse.json({ error: "missing" }, { status: 404 });
    return HttpResponse.json(item);
  }),
);

before(() => server.listen({ onUnhandledFrame: "error" }));
after(() => server.close());

test("lists filters and creates", async () => {
  const api = createApi("http://local");
  assert.equal((await api.list()).length, 1);
  assert.equal((await api.list("bo"))[0].name, "bolt");
  const created = await api.create("nut");
  assert.equal(created.name, "nut");
  assert.equal((await api.get(created.id)).name, "nut");
});

test("404 becomes error", async () => {
  const api = createApi("http://local");
  await assert.rejects(() => api.get(999), (e: any) => e.status === 404);
});
