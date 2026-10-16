import { test } from "node:test";
import assert from "node:assert/strict";
import pTimeout, { TimeoutError } from "p-timeout";
import { withTimeout, withTimeoutFallback } from "../src/timeout.ts";

test("rejects with TimeoutError when the wrapped promise hangs", async () => {
  const hanging = new Promise<never>(() => {});
  await assert.rejects(
    pTimeout(hanging, { milliseconds: 20 }),
    (error: unknown) => {
      assert.ok(error instanceof TimeoutError);
      assert.equal((error as Error).name, "TimeoutError");
      return true;
    },
  );
});

test("supports a custom TimeoutError message", async () => {
  const hanging = new Promise<never>(() => {});
  await assert.rejects(
    withTimeout(hanging, { milliseconds: 20, message: "too slow" }),
    (error: unknown) => {
      assert.ok(error instanceof TimeoutError);
      assert.equal((error as Error).message, "too slow");
      return true;
    },
  );
});

test("resolves with the value when the promise settles in time", async () => {
  const result = await pTimeout(Promise.resolve(42), { milliseconds: 100 });
  assert.equal(result, 42);
});

test("clears the timer once the promise resolves", async () => {
  let scheduledMs: number | undefined;
  let handle: ReturnType<typeof setTimeout> | undefined;
  let clearedHandle: unknown;

  const result = await pTimeout(Promise.resolve("ok"), {
    milliseconds: 1000,
    customTimers: {
      setTimeout: (callback: () => void, milliseconds: number) => {
        scheduledMs = milliseconds;
        handle = setTimeout(callback, milliseconds);
        return handle;
      },
      clearTimeout: (h: unknown) => {
        clearedHandle = h;
        clearTimeout(h as ReturnType<typeof setTimeout>);
      },
    },
  });

  assert.equal(result, "ok");
  assert.equal(scheduledMs, 1000);
  assert.equal(clearedHandle, handle);
});

test("falls back to a value instead of throwing", async () => {
  const hanging = new Promise<never>(() => {});
  const result = await withTimeoutFallback(hanging, 20, () => "fallback");
  assert.equal(result, "fallback");
});
