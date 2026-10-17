import { test } from "node:test";
import assert from "node:assert/strict";
import MockAdapter from "axios-mock-adapter";
import { ApiError, createApiClient, type Todo } from "../src/client.ts";

const BASE_URL = "https://api.example.test";
const TOKEN = "test-token";

function makeClient(timeoutMs = 1000) {
  const api = createApiClient({ baseURL: BASE_URL, token: TOKEN, timeoutMs });
  const mock = new MockAdapter(api.http, { onNoMatch: "throwException" });
  return { api, mock };
}

function readAuthHeader(config: { headers?: unknown }): string | undefined {
  const headers = config.headers;
  if (!headers) return undefined;
  const getter = (headers as { get?: (name: string) => unknown }).get;
  if (typeof getter === "function") {
    const value = getter.call(headers, "Authorization");
    return value == null ? undefined : String(value);
  }
  const value = (headers as Record<string, unknown>)["Authorization"];
  return value == null ? undefined : String(value);
}

test("GET parses data and the request carries the auth header", async (t) => {
  const { api, mock } = makeClient();
  t.after(() => mock.restore());

  const todos: Todo[] = [
    { id: 1, title: "write a recipe", completed: false },
    { id: 2, title: "ship it", completed: true },
  ];
  let seenAuth: string | undefined;
  mock.onGet("/todos").reply((config) => {
    seenAuth = readAuthHeader(config);
    return [200, todos];
  });

  const result = await api.listTodos();

  assert.deepEqual(result, todos);
  assert.equal(seenAuth, `Bearer ${TOKEN}`);
});

test("POST sends the body and parses the created resource", async (t) => {
  const { api, mock } = makeClient();
  t.after(() => mock.restore());

  let seenBody: unknown;
  mock.onPost("/todos").reply((config) => {
    seenBody = JSON.parse(String(config.data));
    return [201, { id: 7, title: "ship it", completed: false }];
  });

  const created = await api.createTodo({ title: "ship it" });

  assert.deepEqual(seenBody, { title: "ship it" });
  assert.deepEqual(created, { id: 7, title: "ship it", completed: false });
});

test("404 rejects with an ApiError that keeps the status", async (t) => {
  const { api, mock } = makeClient();
  t.after(() => mock.restore());

  mock.onGet("/todos/99").reply(404, { message: "not found" });

  await assert.rejects(
    () => api.getTodo(99),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 404);
      assert.equal(error.message, "Request failed with status 404");
      return true;
    },
  );
});

test("network error rejects with an ApiError", async (t) => {
  const { api, mock } = makeClient();
  t.after(() => mock.restore());

  mock.onGet("/todos/1").networkError();

  await assert.rejects(
    () => api.getTodo(1),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.message, "Network error");
      return true;
    },
  );
});

test("timeout rejects with a timeout ApiError", async (t) => {
  const { api, mock } = makeClient(25);
  t.after(() => mock.restore());

  mock.onGet("/todos").timeout();

  await assert.rejects(
    () => api.listTodos(),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.message, "Request timed out");
      assert.equal(error.code, "ECONNABORTED");
      return true;
    },
  );
});
