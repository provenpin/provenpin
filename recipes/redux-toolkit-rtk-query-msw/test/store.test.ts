import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { api, makeStore, signedIn, type Todo } from "../src/store.ts";

const seed = (): Todo[] => [{ id: 1, title: "seed", done: false }];
let todos: Todo[] = seed();
const seen: { method: string; auth: string | null }[] = [];

const server = setupServer(
  http.get("https://api.example.test/todos", ({ request }) => {
    seen.push({ method: "GET", auth: request.headers.get("authorization") });
    return HttpResponse.json(todos);
  }),
  http.post("https://api.example.test/todos", async ({ request }) => {
    const body = (await request.json()) as { title: string };
    const todo = { id: todos.length + 1, title: body.title, done: false };
    todos.push(todo);
    seen.push({ method: "POST", auth: request.headers.get("authorization") });
    return HttpResponse.json(todo, { status: 201 });
  }),
  http.patch("https://api.example.test/todos/:id", async ({ params, request }) => {
    const t = todos.find((x) => x.id === Number(params.id));
    if (!t) return HttpResponse.json({ message: "not found" }, { status: 404 });
    Object.assign(t, await request.json());
    return HttpResponse.json(t);
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => { server.resetHandlers(); todos = seed(); seen.length = 0; });
afterAll(() => server.close());

describe("RTK Query with MSW", () => {
  it("fetches into the cache and sends the auth header from state", async () => {
    const store = makeStore();
    store.dispatch(signedIn("t0k"));
    const r = await store.dispatch(api.endpoints.getTodos.initiate());
    expect(r.data).toEqual([{ id: 1, title: "seed", done: false }]);
    expect(seen).toEqual([{ method: "GET", auth: "Bearer t0k" }]);
    // A second subscriber is served from cache, no new request.
    await store.dispatch(api.endpoints.getTodos.initiate());
    expect(seen).toHaveLength(1);
  });

  it("a mutation invalidates the list tag and triggers a refetch", async () => {
    const store = makeStore();
    const sub = store.dispatch(api.endpoints.getTodos.initiate());
    await sub;
    await store.dispatch(api.endpoints.addTodo.initiate({ title: "write tests" }));
    await expect.poll(() => api.endpoints.getTodos.select()(store.getState()).data?.length).toBe(2);
    expect(seen.map((s) => s.method)).toEqual(["GET", "POST", "GET"]);
    sub.unsubscribe();
  });

  it("optimistic toggle shows immediately and rolls back on a server error", async () => {
    const store = makeStore();
    const sub = store.dispatch(api.endpoints.getTodos.initiate());
    await sub;
    server.use(http.patch("https://api.example.test/todos/:id", () => HttpResponse.json({ message: "nope" }, { status: 500 })));
    const pending = store.dispatch(api.endpoints.toggleTodo.initiate({ id: 1, title: "seed", done: false }));
    expect(api.endpoints.getTodos.select()(store.getState()).data?.[0].done).toBe(true); // optimistic
    const r = await pending;
    expect("error" in r && (r.error as { status: number }).status).toBe(500);
    expect(api.endpoints.getTodos.select()(store.getState()).data?.[0].done).toBe(false); // rolled back
    sub.unsubscribe();
  });

  it("surfaces HTTP errors as { status, data } on the query result", async () => {
    server.use(http.get("https://api.example.test/todos", () => HttpResponse.json({ message: "down" }, { status: 503 })));
    const r = await makeStore().dispatch(api.endpoints.getTodos.initiate());
    expect(r.error).toEqual({ status: 503, data: { message: "down" } });
  });
});
