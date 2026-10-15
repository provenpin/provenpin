import { applyPatches, enablePatches, produceWithPatches, type Patch } from "immer";

enablePatches();

export type Todo = { id: number; text: string; done: boolean };
export type State = { todos: Todo[]; nextId: number };

export function createState(): State {
  return { todos: [], nextId: 1 };
}

export function addTodo(state: State, text: string) {
  return produceWithPatches(state, (draft) => {
    draft.todos.push({ id: draft.nextId++, text, done: false });
  });
}

export function toggleTodo(state: State, id: number) {
  return produceWithPatches(state, (draft) => {
    const t = draft.todos.find((x) => x.id === id);
    if (t) t.done = !t.done;
  });
}

export function undo(state: State, inverse: Patch[]) {
  return applyPatches(state, inverse);
}

export function redo(state: State, patches: Patch[]) {
  return applyPatches(state, patches);
}
