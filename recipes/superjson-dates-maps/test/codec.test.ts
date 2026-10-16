import { test } from "node:test";
import assert from "node:assert/strict";
import { decode, deserialize, encode, serialize } from "../src/codec.ts";

type Payload = {
  when: Date;
  map: Map<string, number>;
  set: Set<string>;
  big: bigint;
  missing: undefined;
};

function sample(): Payload {
  return {
    when: new Date("2024-01-02T03:04:05.000Z"),
    map: new Map<string, number>([
      ["a", 1],
      ["b", 2],
    ]),
    set: new Set<string>(["x", "y"]),
    big: 9007199254740993n,
    missing: undefined,
  };
}

test("round trips Date, Map, Set, BigInt and undefined", () => {
  const back = decode<Payload>(encode(sample()));

  assert.ok(back.when instanceof Date);
  assert.equal(back.when.toISOString(), "2024-01-02T03:04:05.000Z");

  assert.ok(back.map instanceof Map);
  assert.deepEqual([...back.map.entries()], [
    ["a", 1],
    ["b", 2],
  ]);

  assert.ok(back.set instanceof Set);
  assert.deepEqual([...back.set.values()], ["x", "y"]);

  assert.equal(typeof back.big, "bigint");
  assert.equal(back.big, 9007199254740993n);

  assert.ok("missing" in back);
  assert.equal(back.missing, undefined);
});

test("exposes the json and meta annotations", () => {
  const result = serialize(sample());
  const json = result.json as Record<string, unknown>;
  const meta = result.meta as { values?: Record<string, string[]> };

  assert.deepEqual(json.when, "2024-01-02T03:04:05.000Z");
  assert.deepEqual(json.map, [
    ["a", 1],
    ["b", 2],
  ]);
  assert.deepEqual(json.set, ["x", "y"]);
  assert.equal(json.big, "9007199254740993");
  assert.equal(json.missing, null);

  assert.deepEqual(meta.values, {
    when: ["Date"],
    map: ["map"],
    set: ["set"],
    big: ["bigint"],
    missing: ["undefined"],
  });
});

test("stringify and serialize produce equivalent payloads", () => {
  const fromString = decode<Payload>(encode(sample()));
  const fromObject = deserialize<Payload>(serialize(sample()));

  assert.deepEqual(fromObject, fromString);
});
