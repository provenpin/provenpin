import { test } from "node:test";
import assert from "node:assert/strict";
import { createEncoding, countChatTokens, truncateToTokenBudget } from "../src/tokenizer.ts";

test("encode/decode roundtrip is lossless for bundled ranks", () => {
  for (const name of ["cl100k_base", "o200k_base"] as const) {
    const enc = createEncoding(name);
    const text = "ProvenPin recipes run offline with deterministic output.";
    const tokens = enc.encode(text);
    assert.equal(enc.decode(tokens), text);
  }
});

test("token counts are deterministic across instances", () => {
  const text = "count these tokens exactly once";
  const first = createEncoding("cl100k_base").encode(text);
  const second = createEncoding("cl100k_base").encode(text);
  assert.deepEqual(first, second);
});

test("counts chat messages deterministically", () => {
  const enc = createEncoding("cl100k_base");
  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Count my tokens." },
  ];
  const first = countChatTokens(enc, messages);
  const second = countChatTokens(enc, messages);
  assert.equal(first, second);
  const contentOnly = messages.reduce((sum, m) => sum + enc.encode(m.content).length, 0);
  assert.ok(first > contentOnly);
});

test("truncates text to a token budget at a token boundary", () => {
  const enc = createEncoding("o200k_base");
  const text = "The quick brown fox jumps over the lazy dog and keeps on running.";
  const budget = 5;
  const truncated = truncateToTokenBudget(enc, text, budget);
  assert.ok(truncated.length < text.length);
  assert.ok(enc.encode(truncated).length <= budget);
});

test("keeps text unchanged when it fits the budget", () => {
  const enc = createEncoding("cl100k_base");
  const text = "short text";
  assert.equal(truncateToTokenBudget(enc, text, 100), text);
});
