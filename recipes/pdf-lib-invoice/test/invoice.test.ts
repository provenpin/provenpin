import { test } from "node:test";
import assert from "node:assert/strict";
import { buildInvoicePdf, pageCount } from "../src/invoice.ts";

test("builds a readable one-page invoice", async () => {
  const pdf = await buildInvoicePdf({
    number: "INV-100",
    customer: "Ada Lovelace",
    lines: [
      { description: "Consulting", amount: "$120.00" },
      { description: "Hosting", amount: "$15.00" },
    ],
  });
  assert.equal(pdf.subarray(0, 4).toString("utf8"), "%PDF");
  assert.equal(await pageCount(pdf), 1);
  assert.ok(pdf.length > 500);
});
