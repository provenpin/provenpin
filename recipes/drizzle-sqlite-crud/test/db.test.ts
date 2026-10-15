import { test } from "node:test";
import assert from "node:assert/strict";
import { createDb, addTodo, listTodos, completeTodo, deleteTodo } from "../src/db.ts";

test("insert, update, list, delete", () => {
  const db = createDb();
  const t = addTodo(db, "write recipe");
  assert.equal(t.done, false);
  assert.equal(completeTodo(db, t.id).done, true);
  assert.equal(listTodos(db).length, 1);
  deleteTodo(db, t.id);
  assert.equal(listTodos(db).length, 0);
});
