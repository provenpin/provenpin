import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, renderHook, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Todos, useTodos, type Api } from "../src/Todos";

afterEach(cleanup);
// New client per test, retries off, so failures show immediately and cache never leaks between tests.
function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("Todos", () => {
  it("hook resolves data", async () => {
    const api: Api = { list: vi.fn().mockResolvedValue(["a"]), add: vi.fn() };
    const { result } = renderHook(() => useTodos(api), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(["a"]);
  });

  it("renders the error state", async () => {
    const api: Api = { list: vi.fn().mockRejectedValue(new Error("boom")), add: vi.fn() };
    render(<Todos api={api} />, { wrapper: wrapper() });
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Error: boom");
  });

  it("mutation invalidates and refetches", async () => {
    const items = ["a"];
    const api: Api = { list: vi.fn(async () => [...items]), add: vi.fn(async (t: string) => { items.push(t); }) };
    render(<Todos api={api} />, { wrapper: wrapper() });
    await screen.findByText("a");
    fireEvent.click(screen.getByText("Add"));
    await screen.findByText("new");
    expect(api.list).toHaveBeenCalledTimes(2);
  });
});
