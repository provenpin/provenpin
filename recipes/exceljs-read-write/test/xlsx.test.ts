import { test } from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import { buildReport, readSales } from "../src/xlsx.ts";

const sales = [
  { region: "North", units: 3, price: 9.5, date: new Date(Date.UTC(2026, 9, 1)) },
  { region: "South", units: 2, price: 20, date: new Date(Date.UTC(2026, 9, 2)) },
];

test("round-trips rows", async () => {
  const back = await readSales(await buildReport(sales));
  assert.deepEqual(back.map((s) => [s.region, s.units, s.price, s.date.toISOString().slice(0, 10)]), [["North", 3, 9.5, "2026-10-01"], ["South", 2, 20, "2026-10-02"]]);
});

test("formulas, formats and frozen header are written", async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load((await buildReport(sales)) as any);
  const ws = wb.getWorksheet("Sales")!;
  assert.deepEqual(ws.getCell("E2").value, { formula: "B2*C2", result: 28.5 });
  assert.equal((ws.getCell("E4").value as any).formula, "SUM(E2:E3)");
  assert.equal(ws.getCell("C2").numFmt, "$#,##0.00");
  assert.equal(ws.getRow(1).font?.bold, true);
  assert.equal((ws.views[0] as any).state, "frozen");
});
