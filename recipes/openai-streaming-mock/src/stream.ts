import OpenAI from "openai";

export async function streamAnswer(client: OpenAI, prompt: string, onToken: (t: string) => void, signal?: AbortSignal) {
  const stream = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    stream: true,
    stream_options: { include_usage: true },
  }, { signal });
  let text = "", usage: OpenAI.CompletionUsage | undefined;
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) { text += delta; onToken(delta); }
    if (chunk.usage) usage = chunk.usage; // final chunk has empty choices and usage
  }
  return { text, usage };
}
