import { test } from "node:test";
import assert from "node:assert/strict";
import { createPipeline } from "../src/pipeline.ts";

test("callHook runs hooks in registration order", async () => {
  const hooks = createPipeline();
  const order: string[] = [];
  hooks.hook("step:start", () => {
    order.push("a");
  });
  hooks.hook("step:start", () => {
    order.push("b");
  });
  await hooks.callHook("step:start", "compile");
  assert.deepEqual(order, ["a", "b"]);
});

test("callHook awaits async hooks serially", async () => {
  const hooks = createPipeline();
  const order: string[] = [];
  hooks.hook("step:start", async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    order.push("slow");
  });
  hooks.hook("step:start", () => {
    order.push("fast");
  });
  await hooks.callHook("step:start", "x");
  assert.deepEqual(order, ["slow", "fast"]);
});

test("callHookParallel awaits all hooks", async () => {
  const hooks = createPipeline();
  const order: string[] = [];
  hooks.hook("step:start", async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    order.push("slow");
  });
  hooks.hook("step:start", () => {
    order.push("fast");
  });
  await hooks.callHookParallel("step:start", "x");
  assert.deepEqual(order, ["fast", "slow"]);
});

test("hookOnce fires a single time", async () => {
  const hooks = createPipeline();
  let count = 0;
  hooks.hookOnce("step:end", () => {
    count++;
  });
  await hooks.callHook("step:end", "a", 1);
  await hooks.callHook("step:end", "b", 2);
  assert.equal(count, 1);
});

test("removeHook stops a hook from running", async () => {
  const hooks = createPipeline();
  const calls: string[] = [];
  const fn = (name: string) => {
    calls.push(name);
  };
  hooks.hook("step:start", fn);
  hooks.removeHook("step:start", fn);
  await hooks.callHook("step:start", "x");
  assert.deepEqual(calls, []);
});
