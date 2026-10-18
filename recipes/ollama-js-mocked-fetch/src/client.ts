import { Ollama } from "ollama";

export const DEFAULT_HOST = "http://127.0.0.1:11434";

export type OllamaOptions = NonNullable<ConstructorParameters<typeof Ollama>[0]>;
export type OllamaFetch = NonNullable<OllamaOptions["fetch"]>;

export function createOllama(options: OllamaOptions = {}): Ollama {
  return new Ollama({ host: DEFAULT_HOST, ...options });
}

export async function collectChat(
  ollama: Ollama,
  model: string,
  prompt: string,
): Promise<string> {
  const stream = await ollama.chat({
    model,
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });

  let text = "";
  for await (const part of stream) {
    text += part.message.content;
  }
  return text;
}
