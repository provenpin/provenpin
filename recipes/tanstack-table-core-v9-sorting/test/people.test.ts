import { test } from "node:test";
import assert from "node:assert/strict";
import * as tableCore from "@tanstack/table-core";
import { buildTable, pageNames, type Person } from "../src/people.ts";

const data: Person[] = [
  { id: 1, name: "Ada", role: "admin", score: 90 },
  { id: 2, name: "Bob", role: "member", score: 70 },
  { id: 3, name: "Cy", role: "admin", score: 95 },
  { id: 4, name: "Dee", role: "guest", score: 40 },
];

test("v9 drops the v8 createTable and get*RowModel exports", () => {
  assert.equal("createTable" in tableCore, false);
  assert.equal("getSortedRowModel" in tableCore, false);
  assert.equal(typeof tableCore.constructTable, "function");
});

test("sorts by score descending", () => {
  const t = buildTable({ data, sorting: [{ id: "score", desc: true }], pagination: { pageIndex: 0, pageSize: 10 } });
  assert.deepEqual(pageNames(t), ["Cy", "Ada", "Bob", "Dee"]);
});

test("paginates with the default page size of 2", () => {
  const t = buildTable({ data });
  assert.deepEqual(pageNames(t), ["Ada", "Bob"]);
  assert.equal(t.getPageCount(), 2);
});

test("filters by role then paginates", () => {
  const t = buildTable({
    data,
    filters: [{ id: "role", value: "admin" }],
    pagination: { pageIndex: 0, pageSize: 1 },
  });
  assert.equal(t.getFilteredRowModel().rows.length, 2);
  assert.deepEqual(pageNames(t), ["Ada"]);
  t.nextPage();
  assert.deepEqual(pageNames(t), ["Cy"]);
});

test("setters update state on the table", () => {
  const t = buildTable({ data, pagination: { pageIndex: 0, pageSize: 10 } });
  t.setSorting([{ id: "score", desc: false }]);
  assert.deepEqual(pageNames(t), ["Dee", "Bob", "Ada", "Cy"]);
  t.setColumnFilters([{ id: "role", value: "guest" }]);
  assert.deepEqual(pageNames(t), ["Dee"]);
});
