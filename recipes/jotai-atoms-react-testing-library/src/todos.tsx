import { Suspense } from "react";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";

export type Todo = { id: number; title: string; done: boolean };
export type Filter = "all" | "open" | "done";

// Primitive atoms hold state; derived atoms compute from them; write-only atoms are actions.
export const todosAtom = atom<Todo[]>([]);
export const filterAtom = atom<Filter>("all");
export const visibleTodosAtom = atom((get) => {
  const f = get(filterAtom);
  return get(todosAtom).filter((t) => (f === "all" ? true : f === "done" ? t.done : !t.done));
});
export const statsAtom = atom((get) => {
  const all = get(todosAtom);
  return { total: all.length, done: all.filter((t) => t.done).length };
});
export const addTodoAtom = atom(null, (get, set, title: string) => {
  const list = get(todosAtom);
  set(todosAtom, [...list, { id: list.length + 1, title, done: false }]);
});
export const toggleTodoAtom = atom(null, (get, set, id: number) => {
  set(todosAtom, get(todosAtom).map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
});

/** Async derived atom: components reading it suspend until the promise resolves. */
export const userIdAtom = atom(1);
export const makeUserAtom = (fetchUser: (id: number) => Promise<{ name: string }>) => atom((get) => fetchUser(get(userIdAtom)));

export function TodoApp() {
  const [filter, setFilter] = useAtom(filterAtom);
  const visible = useAtomValue(visibleTodosAtom);
  const stats = useAtomValue(statsAtom);
  const add = useSetAtom(addTodoAtom);
  const toggle = useSetAtom(toggleTodoAtom);
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); const input = e.currentTarget.elements.namedItem("title") as HTMLInputElement; if (input.value.trim()) add(input.value.trim()); input.value = ""; }}>
        <input name="title" aria-label="new todo" />
        <button type="submit">Add</button>
      </form>
      <select aria-label="filter" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
        <option value="all">All</option><option value="open">Open</option><option value="done">Done</option>
      </select>
      <ul>{visible.map((t) => <li key={t.id}><label><input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />{t.title}</label></li>)}</ul>
      <p data-testid="stats">{stats.done}/{stats.total} done</p>
    </div>
  );
}

export function UserName({ userAtom }: { userAtom: ReturnType<typeof makeUserAtom> }) {
  const user = useAtomValue(userAtom);
  return <h2>{user.name}</h2>;
}

export function UserPanel({ userAtom }: { userAtom: ReturnType<typeof makeUserAtom> }) {
  return <Suspense fallback={<p>Loading user</p>}><UserName userAtom={userAtom} /></Suspense>;
}
