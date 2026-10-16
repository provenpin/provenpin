import { createSelector, weakMapMemoize } from "reselect";

export type Todo = {
  id: string;
  text: string;
  done: boolean;
};

export type Filter = "all" | "active" | "completed";

export type User = { id: string; name: string };

export type RootState = {
  todos: {
    items: Todo[];
    filter: Filter;
  };
  users: {
    byId: Record<string, User>;
  };
};

export const selectTodoItems = (state: RootState) => state.todos.items;
export const selectTodoFilter = (state: RootState) => state.todos.filter;
export const selectUsersById = (state: RootState) => state.users.byId;

export const selectVisibleTodos = createSelector(
  [selectTodoItems, selectTodoFilter],
  (items, filter) => {
    switch (filter) {
      case "active":
        return items.filter((todo) => !todo.done);
      case "completed":
        return items.filter((todo) => todo.done);
      default:
        return items;
    }
  }
);

export const selectTodoStats = createSelector(
  [selectTodoItems],
  (items) => ({
    total: items.length,
    done: items.filter((todo) => todo.done).length,
  }),
  { memoize: weakMapMemoize }
);

export const makeSelectTodoById = () =>
  createSelector(
    [
      (state: RootState) => state.todos.items,
      (_state: RootState, id: string) => id,
    ],
    (items, id) => items.find((todo) => todo.id === id) ?? null
  );

export const selectUserById = createSelector(
  [selectUsersById, (_state: RootState, id: string) => id],
  (byId, id) => byId[id] ?? null
);
