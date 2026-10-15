import { generateText, streamText, tool, stepCountIs, Output, type LanguageModel } from "ai";
import { z } from "zod";

/** Fake inventory the tool reads from; real code would hit a database or API. */
const STOCK: Record<string, { name: string; qty: number; priceCents: number }> = {
  "SKU-1": { name: "Hard hat", qty: 12, priceCents: 2499 },
  "SKU-2": { name: "Safety glasses", qty: 0, priceCents: 899 },
};

export const tools = {
  checkStock: tool({
    description: "Look up stock and price for a SKU",
    inputSchema: z.object({ sku: z.string().regex(/^SKU-\d+$/) }),
    execute: async ({ sku }) => STOCK[sku] ?? { error: "unknown sku" },
  }),
};

/** Multi-step tool loop: the model may call checkStock, then answers in text. */
export function answerStockQuestion(model: LanguageModel, question: string) {
  return generateText({
    model,
    system: "You answer stock questions. Use the checkStock tool, never guess.",
    prompt: question,
    tools,
    stopWhen: stepCountIs(3),
  });
}

export const Ticket = z.object({
  category: z.enum(["billing", "bug", "feature"]),
  priority: z.enum(["low", "medium", "high"]),
  summary: z.string().max(80),
});

/** Structured output validated against a Zod schema. */
export async function triage(model: LanguageModel, email: string) {
  const r = await generateText({ model, prompt: `Triage this support email:\n${email}`, output: Output.object({ schema: Ticket }) });
  return r.output;
}

/** Streams text deltas and returns them joined, plus the final usage. */
export async function streamSummary(model: LanguageModel, text: string, onDelta: (d: string) => void) {
  const r = streamText({ model, prompt: `Summarise: ${text}` });
  for await (const delta of r.textStream) onDelta(delta);
  return { text: await r.text, usage: await r.totalUsage };
}
