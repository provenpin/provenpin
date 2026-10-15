import { test } from "node:test";
import assert from "node:assert/strict";
import { lineTotal, invoiceTotal } from "../src/money.ts";

test("avoids float drift on line totals", () => {
  assert.equal(lineTotal({ unitPrice: "0.1", qty: 3 }), "0.30");
  assert.notEqual(0.1 * 3, 0.3);
});

test("applies tax and discount", () => {
  const result = invoiceTotal(
    [
      { unitPrice: "19.99", qty: 2 },
      { unitPrice: "5.00", qty: 1 },
    ],
    "0.08",
    "2.00",
  );
  assert.equal(result.subtotal, "44.98");
  assert.equal(result.tax, "3.44");
  assert.equal(result.total, "46.42");
});
