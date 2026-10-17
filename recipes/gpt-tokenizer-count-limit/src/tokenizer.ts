import {
  encode,
  decode,
  encodeChat,
  isWithinTokenLimit,
  type ChatMessage,
} from "gpt-tokenizer";

export function countTokens(text: string): number {
  return encode(text).length;
}

export function roundTrip(text: string): string {
  return decode(encode(text));
}

export function withinLimit(text: string, limit: number): number | false {
  return isWithinTokenLimit(text, limit);
}

export function truncateToTokens(text: string, budget: number): string {
  if (budget <= 0) {
    return "";
  }
  const tokens = encode(text);
  return decode(tokens.slice(0, budget));
}

export function countChatTokens(messages: ChatMessage[]): number {
  return encodeChat(messages, "gpt-4o").length;
}
