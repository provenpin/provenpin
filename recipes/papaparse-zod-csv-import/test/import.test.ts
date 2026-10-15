import { test } from "node:test";
import assert from "node:assert/strict";
import { exportCustomers, importCustomers } from "../src/import.ts";

const csv = "\uFEFFEmail , Name,Seats,Active\na@x.io,\"Lovelace, Ada\",3,yes\nbad,Bo,0,maybe\n\nc@x.io,Cy,10,no\n";

test("valid rows parsed, quoted commas kept, BOM and blank lines ignored", () => {
  assert.deepEqual(importCustomers(csv).ok, [
    { email: "a@x.io", name: "Lovelace, Ada", seats: 3, active: true },
    { email: "c@x.io", name: "Cy", seats: 10, active: false },
  ]);
});

test("errors carry spreadsheet row numbers", () => {
  const { errors } = importCustomers(csv);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].row, 3);
  assert.match(errors[0].message, /email/);
  assert.match(errors[0].message, /seats/);
});

test("round-trips through export", () => {
  const { ok } = importCustomers(csv);
  assert.deepEqual(importCustomers(exportCustomers(ok)).ok, ok);
});
