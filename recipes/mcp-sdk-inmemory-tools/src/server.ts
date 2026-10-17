import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function createServer(): McpServer {
  const server = new McpServer({ name: "inmemory-tools", version: "1.0.0" });

  server.registerTool(
    "add",
    {
      title: "Add",
      description: "Add two numbers together",
      inputSchema: { a: z.number(), b: z.number() },
    },
    async ({ a, b }) => ({
      content: [{ type: "text", text: `${a + b}` }],
    }),
  );

  server.registerTool(
    "greet",
    {
      title: "Greet",
      description: "Greet a person by name",
      inputSchema: { name: z.string() },
    },
    async ({ name }) => ({
      content: [{ type: "text", text: `Hello, ${name}!` }],
    }),
  );

  server.registerResource(
    "greeting",
    "greeting://hello",
    {
      title: "Greeting",
      description: "A static greeting resource",
      mimeType: "text/plain",
    },
    async (uri) => ({
      contents: [{ uri: uri.href, text: "Hello from the resource" }],
    }),
  );

  return server;
}
