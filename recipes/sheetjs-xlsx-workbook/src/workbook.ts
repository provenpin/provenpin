import * as XLSX from "xlsx";

export type Row = { sku: string; qty: number; price: number };

export function rowsToBuffer(rows: Row[]): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Inventory");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function bufferToRows(buf: Buffer): Row[] {
  const wb = XLSX.read(buf, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Row>(ws);
}

export function totalsSheet(rows: Row[]): Array<Array<string | number>> {
  const total = rows.reduce((s, r) => s + r.qty * r.price, 0);
  return [
    ["sku", "line_total"],
    ...rows.map((r) => [r.sku, r.qty * r.price]),
    ["TOTAL", total],
  ];
}

export function writeAoa(aoa: Array<Array<string | number>>): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, ws, "Totals");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
