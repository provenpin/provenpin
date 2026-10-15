import { test } from "node:test";
import assert from "node:assert/strict";
import Anthropic from "@anthropic-ai/sdk";
import { ask } from "../src/agent.ts";

const msg = (content: object[], stop_reason: string) => ({ id: "m", type: "message", role: "assistant", model: "claude-sonnet-4-5", content, stop_reason, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } });

function fake(replies: object[], seen: any[]) {
  const fetch = async (_u: any, init: any) => {
    seen.push(JSON.parse(init.body));
    return new Response(JSON.stringify(replies.shift()), { status: 200, headers: { "content-type": "application/json" } });
  };
  return new Anthropic({ apiKey: "test", baseURL: "http://mock.local", fetch: fetch as any, maxRetries: 0 });
}

test("runs the tool and returns the final text", async () => {
  const seen: any[] = [];
  const c = fake([
    msg([{ type: "tool_use", id: "tu1", name: "lookup_stock", input: { sku: "MUG-1" } }], "tool_use"),
    msg([{ type: "text", text: "There are 7 mugs." }], "end_turn"),
  ], seen);
  assert.equal(await ask(c, "How many mugs?", () => 7), "There are 7 mugs.");
  assert.deepEqual(seen[1].messages[2].content[0], { type: "tool_result", tool_use_id: "tu1", content: "7" });
});

test("invalid tool input is returned as is_error", async () => {
  const seen: any[] = [];
  const c = fake([
    msg([{ type: "tool_use", id: "tu1", name: "lookup_stock", input: { sku: "bad" } }], "tool_use"),
    msg([{ type: "text", text: "Need a valid SKU." }], "end_turn"),
  ], seen);
  await ask(c, "?", () => 0);
  assert.equal(seen[1].messages[2].content[0].is_error, true);
});
