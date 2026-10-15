import { test } from "node:test";
import assert from "node:assert/strict";
import { createBus } from "../src/bus.ts";

test("emits typed events to subscribers", () => {
  const bus = createBus();
  const seen: string[] = [];
  bus.on("user:created", (e) => seen.push(e.email));
  bus.emit("user:created", { id: "1", email: "a@example.com" });
  assert.deepEqual(seen, ["a@example.com"]);
});

test("once unsubscribes after first event", () => {
  const bus = createBus();
  let count = 0;
  bus.once("order:paid", () => {
    count++;
  });
  bus.emit("order:paid", { orderId: "o1", total: 10 });
  bus.emit("order:paid", { orderId: "o2", total: 20 });
  assert.equal(count, 1);
});
