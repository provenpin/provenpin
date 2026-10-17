import { test } from "node:test";
import assert from "node:assert/strict";
import { renderTaskList } from "../src/app.ts";

test("renders title and v-for style list via h()", async () => {
  const html = await renderTaskList({
    title: "Groceries",
    tasks: [
      { id: "1", label: "Milk", done: false },
      { id: "2", label: "Bread", done: true },
    ],
  });

  assert.ok(html.includes('<section class="task-list">'));
  assert.ok(html.includes("<h1>Groceries</h1>"));
  assert.ok(html.includes('<li class="todo"><span class="label">- Milk</span></li>'));
  assert.ok(
    html.includes(
      '<li class="done"><span class="label">- Bread</span><span class="check"> done</span></li>'
    )
  );
});

test("provide/inject prefix reaches child components", async () => {
  const html = await renderTaskList({
    title: "Misc",
    tasks: [{ id: "9", label: "Water", done: false }],
  });

  assert.ok(html.includes('<span class="label">- Water</span>'));
});

test("computed remaining count reflects props", async () => {
  const html = await renderTaskList({
    title: "Work",
    tasks: [
      { id: "a", label: "Spec", done: true },
      { id: "b", label: "Code", done: true },
    ],
  });

  assert.ok(html.includes('<p class="remaining">0 remaining</p>'));
});
