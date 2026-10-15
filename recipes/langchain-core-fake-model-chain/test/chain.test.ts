import { test } from "node:test";
import assert from "node:assert/strict";
import { FakeListChatModel } from "@langchain/core/utils/testing";
import { buildClassifier, formatPrompt } from "../src/chain.ts";

test("parses plain JSON output", async () => {
  const classify = buildClassifier(new FakeListChatModel({ responses: ['{"category":"billing","urgent":true}'] }));
  assert.deepEqual(await classify("I was charged twice!"), { category: "billing", urgent: true });
});

test("strips markdown fences", async () => {
  const classify = buildClassifier(new FakeListChatModel({ responses: ['```json\n{"category":"bug","urgent":false}\n```'] }));
  assert.deepEqual(await classify("button broken"), { category: "bug", urgent: false });
});

test("rejects out-of-schema output", async () => {
  const classify = buildClassifier(new FakeListChatModel({ responses: ['{"category":"sales","urgent":"yes"}'] }));
  await assert.rejects(classify("hi"));
});

test("prompt escapes literal braces and fills the variable", async () => {
  const msgs = await formatPrompt("hello");
  assert.match(String(msgs[0].content), /"category"/);
  assert.equal(msgs[1].content, "hello");
});
