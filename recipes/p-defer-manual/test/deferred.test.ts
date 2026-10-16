import { test } from "node:test";
import assert from "node:assert/strict";
import { createDeferred, isThenable } from "../src/deferred.ts";

test("resolves a deferred promise from outside", async () => {
  const deferred = createDeferred<number>();
  assert.equal(isThenable(deferred.promise), true);

  const seen: number[] = [];
  const tapped = deferred.promise.then((value) => {
    seen.push(value);
    return value;
  });

  deferred.resolve(42);
  assert.equal(await tapped, 42);
  assert.deepEqual(seen, [42]);
});

test("rejects a deferred promise from outside", async () => {
  const deferred = createDeferred<number>();
  assert.equal(isThenable(deferred.promise), true);

  let caught: unknown;
  const tapped = deferred.promise.catch((error) => {
    caught = error;
  });

  const boom = new Error("boom");
  deferred.reject(boom);
  await tapped;
  assert.equal(caught, boom);
});

test("thenable check distinguishes promises from plain values", () => {
  assert.equal(isThenable({ then: 1 }), false);
  assert.equal(isThenable(null), false);
  assert.equal(isThenable(undefined), false);
  assert.equal(isThenable(Promise.resolve()), true);
});
