import OpenAI from "openai";
import { z } from "zod";

const WeatherArgs = z.object({ city: z.string().min(1) });
export const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [{
  type: "function",
  function: { name: "get_weather", description: "Current weather for a city", parameters: { type: "object", properties: { city: { type: "string" } }, required: ["city"] } },
}];

export async function runAgent(client: OpenAI, question: string, getWeather: (city: string) => Promise<string>) {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{ role: "user", content: question }];
  for (let turn = 0; turn < 5; turn++) {
    const res = await client.chat.completions.create({ model: "gpt-4o-mini", messages, tools });
    const msg = res.choices[0].message;
    messages.push(msg);
    if (!msg.tool_calls?.length) return msg.content ?? "";
    for (const call of msg.tool_calls) {
      if (call.type !== "function") continue;
      const parsed = WeatherArgs.safeParse(JSON.parse(call.function.arguments));
      const content = parsed.success ? await getWeather(parsed.data.city) : `invalid arguments: ${parsed.error.message}`;
      messages.push({ role: "tool", tool_call_id: call.id, content });
    }
  }
  throw new Error("too many tool turns");
}
