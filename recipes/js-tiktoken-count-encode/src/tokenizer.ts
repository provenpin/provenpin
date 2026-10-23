import { Tiktoken, type TiktokenBPE } from "js-tiktoken/lite";
import cl100k_base from "js-tiktoken/ranks/cl100k_base";
import o200k_base from "js-tiktoken/ranks/o200k_base";

export type EncodingName = "cl100k_base" | "o200k_base";

const RANKS: Record<EncodingName, TiktokenBPE> = {
  cl100k_base,
  o200k_base,
};

export function createEncoding(name: EncodingName): Tiktoken {
  return new Tiktoken(RANKS[name]);
}

export type ChatMessage = {
  role: string;
  content: string;
  name?: string;
};

export function countChatTokens(enc: Tiktoken, messages: ChatMessage[]): number {
  const tokensPerMessage = 3;
  const tokensPerName = 1;
  let total = 0;
  for (const message of messages) {
    total += tokensPerMessage;
    total += enc.encode(message.role).length;
    total += enc.encode(message.content).length;
    if (message.name !== undefined) {
      total += enc.encode(message.name).length;
      total += tokensPerName;
    }
  }
  total += 3;
  return total;
}

export function truncateToTokenBudget(enc: Tiktoken, text: string, budget: number): string {
  const tokens = enc.encode(text);
  if (tokens.length <= budget) {
    return text;
  }
  return enc.decode(tokens.slice(0, Math.max(0, budget)));
}
