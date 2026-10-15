import { test } from "node:test";
import assert from "node:assert/strict";
import { allCases } from "../src/cases.ts";

test("converts mixed identifiers", () => {
  assert.deepEqual(allCases("hello_world-test"), {
    camel: "helloWorldTest",
    snake: "hello_world_test",
    kebab: "hello-world-test",
    pascal: "HelloWorldTest",
    capital: "Hello World Test",
  });
});

test("handles already camel input", () => {
  const out = allCases("orderId");
  assert.equal(out.snake, "order_id");
  assert.equal(out.kebab, "order-id");
});
