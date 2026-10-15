import Anthropic from "@anthropic-ai/sdk";

export async function streamReply(client: Anthropic, prompt: string, onText: (t: string) => void) {
  const stream = client.messages.stream({ model: "claude-sonnet-4-5", max_tokens: 256, messages: [{ role: "user", content: prompt }] });
  stream.on("text", onText);
  const final = await stream.finalMessage(); // resolves once message_stop arrives
  return { text: final.content.filter((b) => b.type === "text").map((b) => b.text).join(""), stop: final.stop_reason, outputTokens: final.usage.output_tokens };
}
