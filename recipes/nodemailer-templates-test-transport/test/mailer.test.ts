import { test } from "node:test";
import assert from "node:assert/strict";
import { sendInvoice, testTransport } from "../src/mailer.ts";

test("builds a multipart message with attachment", async () => {
  const info: any = await sendInvoice(testTransport(), "ada@example.com", "INV-7", Buffer.from("%PDF-1.4"));
  const msg = JSON.parse(info.message);
  assert.equal(msg.subject, "Invoice INV-7");
  assert.deepEqual(msg.to.map((a: any) => a.address), ["ada@example.com"]);
  assert.match(msg.html, /<b>INV-7<\/b>/);
  assert.ok(msg.text);
  assert.equal(msg.attachments[0].filename, "INV-7.pdf");
  assert.equal(Buffer.from(msg.attachments[0].content, "base64").toString(), "%PDF-1.4");
  const headers = Object.fromEntries(Object.entries(msg.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]));
  assert.equal(headers["x-invoice"], "INV-7");
});

test("envelope has the right sender and recipients", async () => {
  const info: any = await sendInvoice(testTransport(), "bo@example.com", "INV-8", Buffer.alloc(1));
  assert.deepEqual(info.envelope, { from: "billing@example.com", to: ["bo@example.com"] });
});
