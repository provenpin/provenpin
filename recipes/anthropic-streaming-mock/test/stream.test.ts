import { test } from "node:test";
import assert from "node:assert/strict";
import Anthropic from "@anthropic-ai/sdk";
import { streamReply } from "../src/stream.ts";

const ev = (type: string, data: object) => `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`;
function client(events: string[]) {
  const fetch = async () => new Response(new ReadableStream({ start(c) { for (const e of events) c.enqueue(new TextEncoder().encode(e)); c.close(); } }), { status: 200, headers: { "content-type": "text/event-stream" } });
  return new Anthropic({ apiKey: "test", baseURL: "http://mock.local", fetch: fetch as any, maxRetries: 0 });
}

test("streams text deltas and builds the final message", async () => {
  const parts: string[] = [];
  const r = await streamReply(client([
    ev("message_start", { message: { id: "m1", type: "message", role: "assistant", model: "claude-sonnet-4-5", content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 5, output_tokens: 1 } } }),
    ev("content_block_start", { index: 0, content_block: { type: "text", text: "" } }),
    ev("content_block_delta", { index: 0, delta: { type: "text_delta", text: "Hi " } }),
    ev("content_block_delta", { index: 0, delta: { type: "text_delta", text: "there" } }),
    ev("content_block_stop", { index: 0 }),
    ev("message_delta", { delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 3 } }),
    ev("message_stop", {}),
  ]), "hello", (t) => parts.push(t));
  assert.deepEqual(parts, ["Hi ", "there"]);
  assert.deepEqual(r, { text: "Hi there", stop: "end_turn", outputTokens: 3 });
});

test("stream error events reject", async () => {
  await assert.rejects(streamReply(client([ev("error", { error: { type: "overloaded_error", message: "Overloaded" } })]), "x", () => {}));
});
