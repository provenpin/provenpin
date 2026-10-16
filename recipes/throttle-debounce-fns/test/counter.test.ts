import { test, mock } from "node:test";
import assert from "node:assert/strict";
import {
  createCounter,
  debouncedIncrement,
  throttledIncrement,
} from "../src/counter.ts";

function withFakeTimers(run: () => void): void {
  mock.timers.enable({ apis: ["setTimeout", "Date"], now: 1_000_000 });
  try {
    run();
  } finally {
    mock.timers.reset();
  }
}

test("debounce collapses rapid calls into a single execution", () => {
  withFakeTimers(() => {
    const counter = createCounter();
    const bump = debouncedIncrement(100, counter);

    bump();
    bump();
    bump();
    bump();

    assert.equal(counter.value, 0);
    mock.timers.tick(100);
    assert.equal(counter.value, 1);
  });
});

test("debounce cancel drops the pending execution", () => {
  withFakeTimers(() => {
    const counter = createCounter();
    const bump = debouncedIncrement(100, counter);

    bump();
    assert.equal(typeof bump.cancel, "function");
    bump.cancel();

    mock.timers.tick(500);
    assert.equal(counter.value, 0);
  });
});

test("throttle limits the rate of calls", () => {
  withFakeTimers(() => {
    const counter = createCounter();
    const bump = throttledIncrement(100, counter);

    bump();
    bump();
    bump();

    assert.equal(counter.value, 1);
    mock.timers.tick(100);
    assert.equal(counter.value, 2);
  });
});
