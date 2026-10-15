import ExcelJS from "exceljs";

export type Sale = { region: string; units: number; price: number; date: Date };

export async function buildReport(sales: Sale[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sales", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { header: "Region", key: "region", width: 14 },
    { header: "Units", key: "units", width: 8 },
    { header: "Price", key: "price", width: 10, style: { numFmt: "$#,##0.00" } },
    { header: "Date", key: "date", width: 12, style: { numFmt: "yyyy-mm-dd" } },
    { header: "Total", key: "total", width: 12, style: { numFmt: "$#,##0.00" } },
  ];
  ws.getRow(1).font = { bold: true };
  sales.forEach((s, i) => {
    const r = i + 2;
    ws.addRow({ ...s, total: { formula: `B${r}*C${r}`, result: s.units * s.price } });
  });
  const last = sales.length + 1;
  ws.addRow({ region: "TOTAL", total: { formula: `SUM(E2:E${last})`, result: sales.reduce((n, s) => n + s.units * s.price, 0) } });
  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function readSales(buf: Buffer): Promise<Sale[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as any);
  const ws = wb.getWorksheet("Sales") ?? wb.worksheets[0];
  const out: Sale[] = [];
  ws.eachRow((row, n) => {
    if (n === 1 || row.getCell(1).value === "TOTAL") return;
    out.push({ region: String(row.getCell(1).value), units: Number(row.getCell(2).value), price: Number(row.getCell(3).value), date: row.getCell(4).value as Date });
  });
  return out;
}
