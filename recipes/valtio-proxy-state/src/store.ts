import { proxy, snapshot, subscribe } from "valtio/vanilla";

export type Todo = { id: number; text: string; done: boolean };
export type Store = { todos: Todo[]; nextId: number };

export function createStore(): Store {
  return proxy({ todos: [] as Todo[], nextId: 1 });
}

export function addTodo(store: Store, text: string) {
  store.todos.push({ id: store.nextId++, text, done: false });
}

export function toggle(store: Store, id: number) {
  const t = store.todos.find((x) => x.id === id);
  if (t) t.done = !t.done;
}

export function openCount(store: Store) {
  return snapshot(store).todos.filter((t) => !t.done).length;
}

export function watch(store: Store, fn: () => void) {
  return subscribe(store, fn);
}
