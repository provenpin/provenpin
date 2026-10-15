import { test } from "node:test";
import assert from "node:assert/strict";
import { addTodo, createState, redo, toggleTodo, undo } from "../src/store.ts";

test("produceWithPatches supports undo and redo", () => {
  let state = createState();
  const [s1, patches, inverse] = addTodo(state, "write recipe");
  state = s1;
  assert.equal(state.todos.length, 1);
  assert.equal(state.todos[0].done, false);

  const [s2, p2, i2] = toggleTodo(state, 1);
  state = s2;
  assert.equal(state.todos[0].done, true);

  state = undo(state, i2);
  assert.equal(state.todos[0].done, false);
  state = redo(state, p2);
  assert.equal(state.todos[0].done, true);

  state = undo(state, inverse);
  assert.equal(state.todos.length, 0);
  state = redo(state, patches);
  assert.equal(state.todos[0].text, "write recipe");
});
