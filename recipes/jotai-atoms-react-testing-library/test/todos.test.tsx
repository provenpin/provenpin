import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { TodoApp, UserPanel, todosAtom, filterAtom, visibleTodosAtom, statsAtom, addTodoAtom, userIdAtom, makeUserAtom } from "../src/todos.tsx";

afterEach(cleanup);

describe("atoms without React", () => {
  it("derived atoms recompute from a vanilla store", () => {
    const store = createStore();
    store.set(addTodoAtom, "write");
    store.set(addTodoAtom, "test");
    store.set(todosAtom, (list) => list.map((t) => (t.id === 2 ? { ...t, done: true } : t)));
    store.set(filterAtom, "open");
    expect(store.get(visibleTodosAtom).map((t) => t.title)).toEqual(["write"]);
    expect(store.get(statsAtom)).toEqual({ total: 2, done: 1 });
  });

  it("store.sub notifies on changes to a derived atom", () => {
    const store = createStore();
    const seen: number[] = [];
    const unsub = store.sub(statsAtom, () => seen.push(store.get(statsAtom).total));
    store.set(addTodoAtom, "a");
    store.set(addTodoAtom, "b");
    unsub();
    store.set(addTodoAtom, "c");
    expect(seen).toEqual([1, 2]);
  });
});

describe("components", () => {
  it("adds, toggles and filters through the UI with an isolated Provider store", async () => {
    const user = userEvent.setup();
    const store = createStore();
    render(<Provider store={store}><TodoApp /></Provider>);
    await user.type(screen.getByLabelText("new todo"), "ship recipe{Enter}");
    await user.type(screen.getByLabelText("new todo"), "wait for CI{Enter}");
    expect(screen.getByTestId("stats").textContent).toBe("0/2 done");
    await user.click(screen.getByLabelText("ship recipe"));
    expect(screen.getByTestId("stats").textContent).toBe("1/2 done");
    await user.selectOptions(screen.getByLabelText("filter"), "done");
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["ship recipe"]);
    expect(store.get(todosAtom)).toHaveLength(2); // the test can read the same store directly
  });

  it("can be seeded from outside and reacts to external store writes", async () => {
    const store = createStore();
    store.set(todosAtom, [{ id: 1, title: "seeded", done: true }]);
    render(<Provider store={store}><TodoApp /></Provider>);
    expect(screen.getByTestId("stats").textContent).toBe("1/1 done");
    act(() => store.set(addTodoAtom, "from outside"));
    expect(screen.getByTestId("stats").textContent).toBe("1/2 done");
  });

  it("async atoms suspend, then refetch when a dependency changes", async () => {
    // A controllable fetch, so the test decides when each request settles.
    const pending = new Map<number, (u: { name: string }) => void>();
    const userAtom = makeUserAtom((id) => new Promise((resolve) => pending.set(id, resolve)));
    const store = createStore();
    // Under Testing Library (IS_REACT_ACT_ENVIRONMENT) the resumed Suspense boundary commits
    // reliably only when the render and each resolve happen inside an async act.
    await act(async () => { render(<Provider store={store}><UserPanel userAtom={userAtom} /></Provider>); });
    expect(screen.getByText("Loading user")).toBeTruthy();
    await act(async () => { pending.get(1)!({ name: "Ada" }); });
    expect(screen.getByRole("heading", { name: "Ada" })).toBeTruthy();
    await act(async () => { store.set(userIdAtom, 2); });
    await act(async () => { pending.get(2)!({ name: "Grace" }); });
    expect(screen.getByRole("heading", { name: "Grace" })).toBeTruthy();
    expect([...pending.keys()]).toEqual([1, 2]);
  });
});
