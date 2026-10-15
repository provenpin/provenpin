import { test } from "node:test";
import assert from "node:assert/strict";
import { Readable, Writable } from "node:stream";
import { addTotals } from "../src/transform.ts";

function sink() {
  const chunks: string[] = [];
  return { out: new Writable({ write(c, _e, cb) { chunks.push(c.toString()); cb(); } }), text: () => chunks.join("") };
}

test("adds totals and drops bad rows", async () => {
  const s = sink();
  const stats = await addTotals(Readable.from(["sku,qty,price\n", "A, 2 ,1.5\n", "B,0,9\n", "C,1,abc\n", "\n", "D,3,2\n"]), s.out);
  assert.deepEqual(stats, { kept: 2, dropped: 2 });
  assert.equal(s.text(), "sku,qty,price,total\nA,2,1.50,3.00\nD,3,2.00,6.00\n");
});

test("handles a large generated file as a stream", async () => {
  async function* rows() { yield "sku,qty,price\n"; for (let i = 0; i < 50_000; i++) yield `S${i},1,1\n`; }
  assert.equal((await addTotals(Readable.from(rows()), sink().out)).kept, 50_000);
});

test("malformed CSV rejects the pipeline", async () => {
  await assert.rejects(addTotals(Readable.from(['sku,qty,price\n"A,1,1\n']), sink().out));
});
