import { test } from "node:test";
import assert from "node:assert/strict";
import { memoizeSync, memoizeAsync } from "../src/memo.ts";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test("sync memoization caches per argument set", () => {
  let calls = 0;
  const add = memoizeSync((a: number, b: number) => {
    calls++;
    return a + b;
  });

  assert.equal(add(1, 2), 3);
  assert.equal(add(1, 2), 3);
  assert.equal(add(2, 3), 5);
  assert.equal(calls, 2);
});

test("promise-mode memoizes async calls and shares in-flight promise", async () => {
  let calls = 0;
  const fetchValue = memoizeAsync(async (id: string) => {
    calls++;
    await delay(10);
    return `value:${id}`;
  });

  const [a, b] = await Promise.all([fetchValue("x"), fetchValue("x")]);
  assert.equal(a, "value:x");
  assert.equal(b, "value:x");
  assert.equal(await fetchValue("x"), "value:x");
  assert.equal(calls, 1);
});

test("maxAge expires cached sync entries after TTL", async () => {
  let calls = 0;
  const compute = memoizeSync(
    (n: number) => {
      calls++;
      return n * 2;
    },
    { maxAge: 40 },
  );

  assert.equal(compute(5), 10);
  assert.equal(compute(5), 10);
  assert.equal(calls, 1);

  await delay(60);

  assert.equal(compute(5), 10);
  assert.equal(calls, 2);
});

test("delete removes one key and clear removes all keys", () => {
  let calls = 0;
  const square = memoizeSync((n: number) => {
    calls++;
    return n * n;
  });

  assert.equal(square(2), 4);
  assert.equal(square(3), 9);
  assert.equal(calls, 2);

  square.delete(2);
  assert.equal(square(2), 4);
  assert.equal(calls, 3);

  square.clear();
  assert.equal(square(3), 9);
  assert.equal(calls, 4);
});
