import { test } from "node:test";
import assert from "node:assert/strict";
import { createEmitter, type AppEvents } from "../src/emitter.ts";

test("on delivers typed events and off unsubscribes", () => {
  const emitter = createEmitter();
  const seen: string[] = [];
  const handler = (payload: AppEvents["user:created"][0]) => {
    seen.push(payload.email);
  };

  emitter.on("user:created", handler);
  emitter.emit("user:created", { id: "1", email: "a@example.com" });
  emitter.off("user:created", handler);
  emitter.emit("user:created", { id: "2", email: "b@example.com" });

  assert.deepEqual(seen, ["a@example.com"]);
});

test("once fires at most a single time", () => {
  const emitter = createEmitter();
  let count = 0;
  emitter.once("order:paid", () => {
    count++;
  });

  emitter.emit("order:paid", { orderId: "o1", total: 10 });
  emitter.emit("order:paid", { orderId: "o2", total: 20 });

  assert.equal(count, 1);
});

test("listenerCount reflects registered listeners", () => {
  const emitter = createEmitter();
  assert.equal(emitter.listenerCount("error"), 0);

  const first = () => {};
  const second = () => {};
  emitter.on("error", first);
  emitter.on("error", second);

  assert.equal(emitter.listenerCount("error"), 2);
});

test("removeAllListeners clears one event or the whole emitter", () => {
  const emitter = createEmitter();
  emitter.on("error", () => {});
  emitter.on("order:paid", () => {});

  emitter.removeAllListeners("error");
  assert.equal(emitter.listenerCount("error"), 0);
  assert.equal(emitter.listenerCount("order:paid"), 1);

  emitter.removeAllListeners();
  assert.equal(emitter.listenerCount("order:paid"), 0);
});
