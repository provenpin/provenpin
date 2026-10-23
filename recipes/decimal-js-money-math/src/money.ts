import { Decimal } from "decimal.js";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export type Line = { unitPrice: string; qty: number };

export function lineTotal(line: Line) {
  return new Decimal(line.unitPrice).mul(line.qty).toFixed(2);
}

export function invoiceTotal(lines: Line[], taxRate: string, discount: string = "0") {
  const subtotal = lines.reduce(
    (sum, line) => sum.plus(new Decimal(line.unitPrice).mul(line.qty)),
    new Decimal(0),
  );
  const afterDiscount = subtotal.minus(new Decimal(discount));
  const tax = afterDiscount.mul(new Decimal(taxRate));
  return {
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: afterDiscount.plus(tax).toFixed(2),
  };
}
