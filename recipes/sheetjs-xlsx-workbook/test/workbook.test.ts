import { test } from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import { bufferToRows, rowsToBuffer, totalsSheet, writeAoa } from "../src/workbook.ts";

const rows = [
  { sku: "A-1", qty: 2, price: 10 },
  { sku: "B-2", qty: 1, price: 25 },
];

test("json sheet roundtrip", () => {
  const out = bufferToRows(rowsToBuffer(rows));
  assert.deepEqual(out, rows);
});

test("aoa totals workbook", () => {
  const buf = writeAoa(totalsSheet(rows));
  const wb = XLSX.read(buf, { type: "buffer" });
  const data = XLSX.utils.sheet_to_json<(string | number)[]>(wb.Sheets.Totals, { header: 1 });
  assert.deepEqual(data[0], ["sku", "line_total"]);
  assert.deepEqual(data.at(-1), ["TOTAL", 45]);
});
