import { test } from "node:test";
import assert from "node:assert/strict";
import { MockLanguageModelV4, simulateReadableStream } from "ai/test";
import { answerStockQuestion, triage, streamSummary } from "../src/agent.ts";

const usage = (input: number, output: number) => ({
  inputTokens: { total: input, noCache: input, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: output, text: output, reasoning: undefined },
});
const finish = (unified: "stop" | "tool-calls") => ({ unified, raw: unified });

test("tool loop: model calls checkStock, gets the result, then answers", async () => {
  const model = new MockLanguageModelV4({
    doGenerate: [
      { content: [{ type: "tool-call", toolCallId: "call-1", toolName: "checkStock", input: JSON.stringify({ sku: "SKU-1" }) }], finishReason: finish("tool-calls"), usage: usage(20, 5), warnings: [] },
      { content: [{ type: "text", text: "We have 12 hard hats at $24.99." }], finishReason: finish("stop"), usage: usage(40, 10), warnings: [] },
    ],
  });
  const r = await answerStockQuestion(model, "How many hard hats are in stock?");
  assert.equal(r.text, "We have 12 hard hats at $24.99.");
  assert.equal(r.steps.length, 2);
  assert.deepEqual(r.steps[0].toolResults.map((t) => t.output), [{ name: "Hard hat", qty: 12, priceCents: 2499 }]);
  assert.equal(r.totalUsage.inputTokens, 60);
  // The second model call must include the tool result in its prompt.
  const second = JSON.stringify(model.doGenerateCalls[1].prompt);
  assert.match(second, /"qty":12/);
  assert.equal(model.doGenerateCalls[0].tools?.[0].name, "checkStock");
});

test("stopWhen caps a model that keeps calling tools", async () => {
  const call = { content: [{ type: "tool-call" as const, toolCallId: "c", toolName: "checkStock", input: '{"sku":"SKU-2"}' }], finishReason: finish("tool-calls"), usage: usage(1, 1), warnings: [] };
  const model = new MockLanguageModelV4({ doGenerate: async () => call });
  const r = await answerStockQuestion(model, "loop forever");
  assert.equal(r.steps.length, 3);
  assert.equal(model.doGenerateCalls.length, 3);
});

test("structured output is parsed and validated with the zod schema", async () => {
  const good = new MockLanguageModelV4({ doGenerate: { content: [{ type: "text", text: JSON.stringify({ category: "billing", priority: "high", summary: "Charged twice" }) }], finishReason: finish("stop"), usage: usage(30, 12), warnings: [] } });
  assert.deepEqual(await triage(good, "I was charged twice!"), { category: "billing", priority: "high", summary: "Charged twice" });
  assert.equal(good.doGenerateCalls[0].responseFormat?.type, "json");

  const bad = new MockLanguageModelV4({ doGenerate: { content: [{ type: "text", text: JSON.stringify({ category: "spam", priority: "high", summary: "x" }) }], finishReason: finish("stop"), usage: usage(1, 1), warnings: [] } });
  await assert.rejects(triage(bad, "?"));
});

test("streamText delivers deltas in order", async () => {
  const model = new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "stream-start", warnings: [] },
          { type: "text-start", id: "t1" },
          { type: "text-delta", id: "t1", delta: "Short " },
          { type: "text-delta", id: "t1", delta: "and " },
          { type: "text-delta", id: "t1", delta: "sweet." },
          { type: "text-end", id: "t1" },
          { type: "finish", finishReason: finish("stop"), usage: usage(8, 3) },
        ],
      }),
    }),
  });
  const deltas: string[] = [];
  const r = await streamSummary(model, "a long text", (d) => deltas.push(d));
  assert.deepEqual(deltas, ["Short ", "and ", "sweet."]);
  assert.equal(r.text, "Short and sweet.");
  assert.equal(r.usage.outputTokens, 3);
});
