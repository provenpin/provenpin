import { test } from "node:test";
import assert from "node:assert/strict";
import { generatePdf } from "../src/pdf.ts";

test("generates a PDF starting with %PDF and a non-trivial length", async () => {
  const pdf = await generatePdf(
    "Quarterly Report",
    "This document is produced entirely offline using pdfkit's built-in fonts.",
    [
      ["Region", "Units", "Revenue"],
      ["North", "120", "$4,800"],
      ["South", "95", "$3,700"],
      ["East", "140", "$5,600"],
    ],
  );

  assert.ok(Buffer.isBuffer(pdf));
  assert.equal(pdf.subarray(0, 5).toString("latin1"), "%PDF-");
  assert.ok(pdf.length > 500, `expected a non-trivial length, got ${pdf.length}`);
});

test("writes a valid EOF marker", async () => {
  const pdf = await generatePdf("Empty", "No rows here.", [["A", "B", "C"]]);
  assert.ok(pdf.subarray(0, 5).toString("latin1").startsWith("%PDF"));
  assert.ok(pdf.subarray(-1024).toString("latin1").includes("%%EOF"));
});
