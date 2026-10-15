import { describe, it, expect, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { addTodo, openTodos, signIn } from "../src/todos";

const URL_ = "https://demo.supabase.co";
function client(handler: (url: URL, init: RequestInit) => Response) {
  const fetch = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => handler(new URL(String(input instanceof Request ? input.url : input)), init));
  const sb = createClient(URL_, "anon-key", { global: { fetch: fetch as any }, auth: { persistSession: false, autoRefreshToken: false } });
  return { sb, fetch };
}
const ok = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("todos", () => {
  it("builds the PostgREST filter query", async () => {
    const { sb, fetch } = client(() => ok([{ id: 1, title: "a", done: false, user_id: "u1" }]));
    expect(await openTodos(sb, "u1")).toHaveLength(1);
    const url = new URL(String(fetch.mock.calls[0][0]));
    expect(url.pathname).toBe("/rest/v1/todos");
    expect(url.searchParams.get("user_id")).toBe("eq.u1");
    expect(url.searchParams.get("done")).toBe("eq.false");
  });

  it("insert + single returns the row", async () => {
    const { sb, fetch } = client(() => ok({ id: 2, title: "b", done: false, user_id: "u1" }, 201));
    expect((await addTodo(sb, "u1", "b")).id).toBe(2);
    expect(fetch.mock.calls[0][1]?.method).toBe("POST");
  });

  it("surfaces PostgREST errors", async () => {
    const { sb } = client(() => ok({ code: "42501", message: "permission denied for table todos", details: null, hint: null }, 403));
    await expect(openTodos(sb, "u1")).rejects.toThrow(/permission denied/);
  });

  it("signs in through GoTrue", async () => {
    const { sb, fetch } = client((url) => {
      expect(url.pathname).toBe("/auth/v1/token");
      expect(url.searchParams.get("grant_type")).toBe("password");
      return ok({ access_token: "at", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: "rt", user: { id: "u1", aud: "authenticated", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } });
    });
    expect(await signIn(sb, "a@example.com", "pw")).toBe("u1");
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
