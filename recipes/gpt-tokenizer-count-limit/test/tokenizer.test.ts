import { test } from "node:test";
import assert from "node:assert/strict";
import type { ChatMessage } from "gpt-tokenizer";
import {
  countTokens,
  roundTrip,
  withinLimit,
  truncateToTokens,
  countChatTokens,
} from "../src/tokenizer.ts";

test("encode and decode round trip text", () => {
  const text = "ProvenPin recipes are small and offline.";
  assert.equal(roundTrip(text), text);
});

test("token counts are positive and stable", () => {
  const text = "The quick brown fox jumps over the lazy dog.";
  const first = countTokens(text);
  const second = countTokens(text);
  assert.ok(first > 0);
  assert.equal(first, second);
});

test("isWithinTokenLimit reflects the budget", () => {
  const text = "gpt-tokenizer counts tokens deterministically";
  const total = countTokens(text);
  assert.ok(total > 0);
  assert.equal(withinLimit(text, total), total);
  assert.equal(withinLimit(text, total + 5), total);
  assert.equal(withinLimit(text, total - 1), false);
});

test("encodeChat counts tokens for a short chat", () => {
  const messages: ChatMessage[] = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "How many tokens is this?" },
  ];
  const count = countChatTokens(messages);
  assert.ok(count > 0);
  assert.equal(count, countChatTokens(messages));
});

test("truncates text to a token budget", () => {
  const text = "Truncate this sentence to a small token budget safely.";
  const full = countTokens(text);
  assert.ok(full > 0);
  const budget = Math.max(1, Math.floor(full / 2));
  const truncated = truncateToTokens(text, budget);
  const truncatedCount = countTokens(truncated);
  assert.ok(truncatedCount > 0);
  assert.ok(truncatedCount <= budget);
  assert.equal(truncateToTokens(text, budget), truncated);
});
