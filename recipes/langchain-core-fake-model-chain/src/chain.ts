import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { z } from "zod";

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "Classify the support ticket. Reply with JSON: {{\"category\": \"billing\"|\"bug\"|\"other\", \"urgent\": boolean}}"],
  ["human", "{ticket}"],
]);
const Result = z.object({ category: z.enum(["billing", "bug", "other"]), urgent: z.boolean() });

export function buildClassifier(model: BaseChatModel) {
  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  return async (ticket: string) => {
    const raw = await chain.invoke({ ticket });
    const json = raw.replace(/^```(json)?\s*|```\s*$/g, "").trim(); // models often wrap JSON in fences
    return Result.parse(JSON.parse(json));
  };
}

export const formatPrompt = (ticket: string) => prompt.formatMessages({ ticket });
