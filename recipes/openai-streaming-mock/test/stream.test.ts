import { test } from "node:test";
import assert from "node:assert/strict";
import OpenAI from "openai";
import { streamAnswer } from "../src/stream.ts";

const chunk = (o: object) => `data: ${JSON.stringify({ id: "c", object: "chat.completion.chunk", created: 0, model: "gpt-4o-mini", ...o })}\n\n`;
function sseClient(events: string[], seen: any[] = []) {
  const fetch = async (_u: any, init: any) => {
    seen.push(JSON.parse(init.body));
    const body = new ReadableStream({ start(c) { for (const e of events) c.enqueue(new TextEncoder().encode(e)); c.close(); } });
    return new Response(body, { status: 200, headers: { "content-type": "text/event-stream" } });
  };
  return new OpenAI({ apiKey: "test", baseURL: "http://mock.local/v1", fetch: fetch as any, maxRetries: 0 });
}

test("accumulates deltas and usage", async () => {
  const seen: any[] = [];
  const tokens: string[] = [];
  const client = sseClient([
    chunk({ choices: [{ index: 0, delta: { role: "assistant", content: "" }, finish_reason: null }] }),
    chunk({ choices: [{ index: 0, delta: { content: "Hel" }, finish_reason: null }] }),
    chunk({ choices: [{ index: 0, delta: { content: "lo" }, finish_reason: "stop" }] }),
    chunk({ choices: [], usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 } }),
    "data: [DONE]\n\n",
  ], seen);
  const r = await streamAnswer(client, "hi", (t) => tokens.push(t));
  assert.equal(r.text, "Hello");
  assert.deepEqual(tokens, ["Hel", "lo"]);
  assert.equal(r.usage?.total_tokens, 5);
  assert.equal(seen[0].stream, true);
  assert.deepEqual(seen[0].stream_options, { include_usage: true });
});

test("abort rejects", async () => {
  const ac = new AbortController();
  ac.abort();
  await assert.rejects(streamAnswer(sseClient([]), "hi", () => {}, ac.signal));
});
