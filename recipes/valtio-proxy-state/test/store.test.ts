import { test } from "node:test";
import assert from "node:assert/strict";
import { snapshot } from "valtio/vanilla";
import { addTodo, createStore, openCount, toggle, watch } from "../src/store.ts";

test("proxy mutations notify subscribers and snapshot is immutable", async () => {
  const store = createStore();
  let ticks = 0;
  const unsub = watch(store, () => { ticks++; });
  addTodo(store, "ship");
  addTodo(store, "docs");
  toggle(store, 1);
  await Promise.resolve();
  assert.ok(ticks >= 1);
  assert.equal(openCount(store), 1);
  const snap = snapshot(store);
  assert.equal(snap.todos[0].done, true);
  assert.throws(() => { (snap.todos[0] as { done: boolean }).done = false; });
  unsub();
});
