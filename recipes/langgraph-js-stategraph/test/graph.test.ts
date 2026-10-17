import { test } from "node:test";
import assert from "node:assert/strict";
import { MemorySaver } from "@langchain/langgraph";
import { buildGraph } from "../src/graph.ts";

test("routes through the conditional edge and accumulates state on one thread", async () => {
  const app = buildGraph(new MemorySaver());
  const config = { configurable: { thread_id: "thread-1" } };

  const first = await app.invoke({ input: "ab" }, config);
  assert.deepEqual(first.steps, ["classify:ab=even", "handle:ab"]);
  assert.equal(first.route, "even");

  const second = await app.invoke({ input: "abc" }, config);
  assert.deepEqual(second.steps, [
    "classify:ab=even",
    "handle:ab",
    "classify:abc=odd",
  ]);
  assert.equal(second.route, "odd");
});

test("keeps separate state per thread", async () => {
  const app = buildGraph(new MemorySaver());

  await app.invoke({ input: "abcd" }, { configurable: { thread_id: "a" } });
  const other = await app.invoke(
    { input: "abcde" },
    { configurable: { thread_id: "b" } },
  );

  assert.deepEqual(other.steps, ["classify:abcde=odd"]);
  assert.equal(other.route, "odd");
});
