import { test } from "node:test";
import assert from "node:assert/strict";
import { createSelector } from "reselect";
import {
  makeSelectTodoById,
  selectTodoStats,
  selectUserById,
  selectVisibleTodos,
  type RootState,
} from "../src/selectors.ts";

const state: RootState = {
  todos: {
    items: [
      { id: "1", text: "write tests", done: true },
      { id: "2", text: "ship recipe", done: false },
    ],
    filter: "active",
  },
  users: { byId: { u1: { id: "u1", name: "Ada" } } },
};

test("combines multiple input selectors", () => {
  assert.deepEqual(
    selectVisibleTodos(state).map((todo) => todo.id),
    ["2"]
  );
});

test("runs the combiner once for identical inputs", () => {
  let calls = 0;
  const selectCount = createSelector(
    [(s: RootState) => s.todos.items],
    (items) => {
      calls++;
      return items.length;
    }
  );

  assert.equal(selectCount(state), 2);
  assert.equal(selectCount(state), 2);
  assert.equal(calls, 1);
});

test("recomputes the combiner when inputs change", () => {
  let calls = 0;
  const selectCount = createSelector(
    [(s: RootState) => s.todos.items],
    (items) => {
      calls++;
      return items.length;
    }
  );

  selectCount(state);
  selectCount({
    ...state,
    todos: { ...state.todos, items: state.todos.items.slice(0, 1) },
  });
  assert.equal(calls, 2);
});

test("weakMapMemoize returns a stable reference for stable inputs", () => {
  const first = selectTodoStats(state);
  const second = selectTodoStats(state);
  assert.equal(first, second);
  assert.deepEqual(first, { total: 2, done: 1 });
});

test("parameterized selector resolves per-argument results", () => {
  const selectTodoById = makeSelectTodoById();
  assert.equal(selectTodoById(state, "1")?.text, "write tests");
  assert.equal(selectTodoById(state, "2")?.text, "ship recipe");
  assert.equal(selectTodoById(state, "missing"), null);
});

test("parameterized selector memoizes repeated arguments", () => {
  const first = selectUserById(state, "u1");
  const second = selectUserById(state, "u1");
  assert.equal(first, second);
  assert.equal(first?.name, "Ada");
});
