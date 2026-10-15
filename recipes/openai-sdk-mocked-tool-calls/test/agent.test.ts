import { test } from "node:test";
import assert from "node:assert/strict";
import OpenAI from "openai";
import { runAgent } from "../src/agent.ts";

function completion(message: object) {
  return { id: "c1", object: "chat.completion", created: 0, model: "gpt-4o-mini", choices: [{ index: 0, finish_reason: "stop", logprobs: null, message: { role: "assistant", content: null, refusal: null, ...message } }] };
}

function fakeClient(replies: object[], seen: any[]) {
  const fetch = async (_url: any, init: any) => {
    seen.push(JSON.parse(init.body));
    return new Response(JSON.stringify(replies.shift()), { status: 200, headers: { "content-type": "application/json" } });
  };
  return new OpenAI({ apiKey: "test", baseURL: "http://mock.local/v1", fetch: fetch as any, maxRetries: 0 });
}

test("calls the tool then answers", async () => {
  const seen: any[] = [];
  const client = fakeClient([
    completion({ tool_calls: [{ id: "t1", type: "function", function: { name: "get_weather", arguments: JSON.stringify({ city: "Anchorage" }) } }] }),
    completion({ content: "It is 2C in Anchorage." }),
  ], seen);
  const answer = await runAgent(client, "Weather in Anchorage?", async (c) => `2C in ${c}`);
  assert.equal(answer, "It is 2C in Anchorage.");
  const toolMsg = seen[1].messages.find((m: any) => m.role === "tool");
  assert.deepEqual(toolMsg, { role: "tool", tool_call_id: "t1", content: "2C in Anchorage" });
  assert.equal(seen[0].tools[0].function.name, "get_weather");
});

test("bad tool arguments are reported back, not thrown", async () => {
  const seen: any[] = [];
  const client = fakeClient([
    completion({ tool_calls: [{ id: "t1", type: "function", function: { name: "get_weather", arguments: "{}" } }] }),
    completion({ content: "Which city?" }),
  ], seen);
  assert.equal(await runAgent(client, "Weather?", async () => "x"), "Which city?");
  assert.match(seen[1].messages.at(-1).content, /invalid arguments/);
});
