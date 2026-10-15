import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTable, pageNames, type Person } from "../src/people.ts";

const data: Person[] = [
  { id: 1, name: "Ada", role: "admin", score: 90 },
  { id: 2, name: "Bob", role: "member", score: 70 },
  { id: 3, name: "Cy", role: "admin", score: 95 },
  { id: 4, name: "Dee", role: "guest", score: 40 },
];

test("sorts by score descending", () => {
  const t = buildTable({ data, sorting: [{ id: "score", desc: true }], pagination: { pageIndex: 0, pageSize: 10 } });
  assert.deepEqual(pageNames(t), ["Cy", "Ada", "Bob", "Dee"]);
});

test("filters by role then paginates", () => {
  const t = buildTable({
    data,
    filters: [{ id: "role", value: "admin" }],
    pagination: { pageIndex: 0, pageSize: 1 },
  });
  assert.equal(t.getFilteredRowModel().rows.length, 2);
  assert.deepEqual(pageNames(t), ["Ada"]);
  const page2 = buildTable({
    data,
    filters: [{ id: "role", value: "admin" }],
    pagination: { pageIndex: 1, pageSize: 1 },
  });
  assert.deepEqual(pageNames(page2), ["Cy"]);
});
