import { test } from "node:test";
import assert from "node:assert/strict";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import { convert, runAgent, type ChatModel } from "../src/agent.ts";

const scripted = (...replies: AIMessage[]): ChatModel => ({ invoke: async () => replies.shift()! });

test("tool validates and runs directly", async () => {
  assert.equal(await convert.invoke({ amount: 100, from: "USD", to: "EUR" }), "90");
  await assert.rejects(convert.invoke({ amount: -1, from: "USD", to: "EUR" } as any));
});

test("loop executes tool calls and returns final answer", async () => {
  const { answer, msgs } = await runAgent(scripted(
    new AIMessage({ content: "", tool_calls: [{ id: "c1", name: "convert_currency", args: { amount: 10, from: "EUR", to: "USD" } }] }),
    new AIMessage("10 EUR is about 11.11 USD."),
  ), "10 EUR in USD?");
  assert.equal(answer, "10 EUR is about 11.11 USD.");
  const tm = msgs.find((m) => m instanceof ToolMessage) as ToolMessage;
  assert.equal(tm.content, "11.11");
  assert.equal(tm.tool_call_id, "c1");
});

test("bad args are returned to the model as an error", async () => {
  const { msgs } = await runAgent(scripted(
    new AIMessage({ content: "", tool_calls: [{ id: "c1", name: "convert_currency", args: { amount: 5, from: "JPY", to: "USD" } }] }),
    new AIMessage("Sorry, unsupported currency."),
  ), "?");
  assert.match(String((msgs[2] as ToolMessage).content), /^error:/);
});
