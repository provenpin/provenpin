import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const LookupInput = z.object({ sku: z.string().regex(/^[A-Z]+-\d+$/) });
export const tools: Anthropic.Tool[] = [{
  name: "lookup_stock",
  description: "Units in stock for a SKU",
  input_schema: { type: "object", properties: { sku: { type: "string" } }, required: ["sku"] },
}];

export async function ask(client: Anthropic, question: string, stock: (sku: string) => number) {
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: question }];
  for (let i = 0; i < 5; i++) {
    const res = await client.messages.create({ model: "claude-sonnet-4-5", max_tokens: 512, messages, tools });
    messages.push({ role: "assistant", content: res.content });
    if (res.stop_reason !== "tool_use") return res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of res.content) {
      if (block.type !== "tool_use") continue;
      const p = LookupInput.safeParse(block.input);
      results.push(p.success
        ? { type: "tool_result", tool_use_id: block.id, content: String(stock(p.data.sku)) }
        : { type: "tool_result", tool_use_id: block.id, content: "invalid sku", is_error: true });
    }
    messages.push({ role: "user", content: results });
  }
  throw new Error("too many turns");
}
