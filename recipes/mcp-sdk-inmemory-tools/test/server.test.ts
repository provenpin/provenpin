import { test } from "node:test";
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/server.ts";

async function connect() {
  const server = createServer();
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return { client, server };
}

test("lists the two registered tools", async () => {
  const { client, server } = await connect();
  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name).sort();
  assert.deepEqual(names, ["add", "greet"]);
  await client.close();
  await server.close();
});

test("callTool returns text content", async () => {
  const { client, server } = await connect();
  const result = await client.callTool({
    name: "add",
    arguments: { a: 2, b: 3 },
  });
  assert.ok(!result.isError);
  const [first] = result.content as Array<{ type: string; text: string }>;
  assert.equal(first.type, "text");
  assert.equal(first.text, "5");
  await client.close();
  await server.close();
});

test("readResource returns the registered resource", async () => {
  const { client, server } = await connect();
  const result = await client.readResource({ uri: "greeting://hello" });
  const [first] = result.contents as Array<{ uri: string; text?: string }>;
  assert.equal(first.uri, "greeting://hello");
  assert.equal(first.text, "Hello from the resource");
  await client.close();
  await server.close();
});

test("callTool reports an error result for invalid input", async () => {
  const { client, server } = await connect();
  const result = await client.callTool({
    name: "greet",
    arguments: { name: 123 },
  });
  assert.equal(result.isError, true);
  await client.close();
  await server.close();
});
