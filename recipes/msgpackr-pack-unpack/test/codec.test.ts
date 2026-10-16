import { test } from "node:test";
import assert from "node:assert/strict";
import { Packr, Unpackr } from "msgpackr";
import {
  decodeEvent,
  encodeEvent,
  packedSize,
  jsonSize,
  type EventRecord,
} from "../src/codec.ts";

test("roundtrips dates, maps and binary", () => {
  const event: EventRecord = {
    id: "evt-1",
    at: new Date("2024-01-02T03:04:05.678Z"),
    labels: new Map<string, string>([
      ["env", "prod"],
      ["region", "eu"],
    ]),
    payload: Buffer.from([0, 1, 2, 255]),
  };

  const decoded = decodeEvent(encodeEvent(event));

  assert.equal(decoded.id, "evt-1");
  assert.ok(decoded.at instanceof Date);
  assert.equal(decoded.at.getTime(), event.at.getTime());
  assert.ok(decoded.labels instanceof Map);
  assert.deepEqual([...decoded.labels], [...event.labels]);
  assert.ok(Buffer.isBuffer(decoded.payload));
  assert.deepEqual(decoded.payload, event.payload);
});

test("Packr and Unpackr honor options", () => {
  const packr = new Packr({ useRecords: false });
  const unpackr = new Unpackr({ useRecords: false, mapsAsObjects: true });

  const packed = packr.pack({ a: 1, b: [2, 3] });

  assert.deepEqual(unpackr.unpack(packed), { a: 1, b: [2, 3] });
});

test("packed repetitive data is smaller than JSON", () => {
  const rows = Array.from({ length: 50 }, (_, index) => ({
    kind: "user.activity.login.success",
    region: "europe-west-1",
    active: true,
    index,
  }));

  assert.ok(packedSize(rows) < jsonSize(rows));
});
