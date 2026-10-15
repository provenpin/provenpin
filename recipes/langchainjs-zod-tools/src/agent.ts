import { tool } from "@langchain/core/tools";
import { AIMessage, HumanMessage, ToolMessage, type BaseMessage } from "@langchain/core/messages";
import { z } from "zod";

export const convert = tool(async ({ amount, from, to }) => {
  const rates: Record<string, number> = { USD: 1, EUR: 0.9, GBP: 0.8 };
  return String(Math.round((amount / rates[from]) * rates[to] * 100) / 100);
}, {
  name: "convert_currency",
  description: "Convert an amount between USD, EUR and GBP",
  schema: z.object({ amount: z.number().positive(), from: z.enum(["USD", "EUR", "GBP"]), to: z.enum(["USD", "EUR", "GBP"]) }),
});
export const tools = [convert];

export type ChatModel = { invoke: (msgs: BaseMessage[]) => Promise<AIMessage> }; // e.g. new ChatOpenAI().bindTools(tools)

export async function runAgent(model: ChatModel, question: string, maxTurns = 4) {
  const msgs: BaseMessage[] = [new HumanMessage(question)];
  for (let i = 0; i < maxTurns; i++) {
    const ai = await model.invoke(msgs);
    msgs.push(ai);
    if (!ai.tool_calls?.length) return { answer: String(ai.content), msgs };
    for (const call of ai.tool_calls) {
      const t = tools.find((x) => x.name === call.name);
      let content: string;
      try { content = t ? String(await t.invoke(call.args as any)) : `unknown tool ${call.name}`; }
      catch (e) { content = `error: ${(e as Error).message}`; } // schema errors go back to the model
      msgs.push(new ToolMessage({ content, tool_call_id: call.id! }));
    }
  }
  throw new Error("too many turns");
}
