import { parse } from "csv-parse";
import { stringify } from "csv-stringify";
import { Transform, type Readable, type Writable } from "node:stream";
import { pipeline } from "node:stream/promises";

type Row = { sku: string; qty: string; price: string };

// Adds a total column, drops bad rows. Constant memory for any file size.
export async function addTotals(input: Readable, output: Writable) {
  const stats = { kept: 0, dropped: 0 };
  const logic = new Transform({
    objectMode: true,
    transform(row: Row, _enc, cb) {
      const qty = Number(row.qty), price = Number(row.price);
      if (!qty || Number.isNaN(price)) { stats.dropped++; return cb(); }
      stats.kept++;
      cb(null, { sku: row.sku, qty, price: price.toFixed(2), total: (qty * price).toFixed(2) });
    },
  });
  await pipeline(
    input,
    parse({ columns: true, trim: true, skip_empty_lines: true, bom: true }),
    logic,
    stringify({ header: true, columns: ["sku", "qty", "price", "total"] }),
    output,
  );
  return stats;
}
