import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createOllama,
  collectChat,
  DEFAULT_HOST,
  type OllamaFetch,
} from "../src/client.ts";

type RecordedCall = {
  url: string;
  method: string | undefined;
  contentType: string | null;
  body: any;
};

type RouteHandler = (body: any) => Response;

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function createFetch(routes: Record<string, RouteHandler>) {
  const calls: RecordedCall[] = [];

  const fetchImpl: FetchLike = async (input, init) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const headers = new Headers(init?.headers);
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : undefined;

    calls.push({
      url,
      method: init?.method,
      contentType: headers.get("content-type"),
      body,
    });

    const route = routes[new URL(url).pathname];
    assert.ok(route, `unexpected request to ${url}`);
    return route!(body);
  };

  return { fetchImpl, calls };
}

function ollamaWith(fetchImpl: FetchLike) {
  return createOllama({ fetch: fetchImpl as unknown as OllamaFetch });
}

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function ndjsonResponse(chunks: unknown[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(`${JSON.stringify(chunk)}\n`));
      }
      controller.close();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { "content-type": "application/x-ndjson" },
  });
}

test("chat posts the request body and parses the reply", async () => {
  const { fetchImpl, calls } = createFetch({
    "/api/chat": () =>
      jsonResponse({
        model: "llama3.2",
        created_at: "2026-01-01T00:00:00Z",
        message: { role: "assistant", content: "Hello from the fake server" },
        done: true,
      }),
  });

  const ollama = ollamaWith(fetchImpl);
  const reply = await ollama.chat({
    model: "llama3.2",
    messages: [{ role: "user", content: "Say hello" }],
  });

  assert.equal(reply.message.content, "Hello from the fake server");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${DEFAULT_HOST}/api/chat`);
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].contentType, "application/json");
  assert.notEqual(calls[0].body.stream, true);
  assert.equal(calls[0].body.model, "llama3.2");
  assert.deepEqual(calls[0].body.messages, [{ role: "user", content: "Say hello" }]);
});

test("streamed chat concatenates NDJSON chunks in order", async () => {
  const { fetchImpl, calls } = createFetch({
    "/api/chat": () =>
      ndjsonResponse([
        { model: "llama3.2", created_at: "t", message: { role: "assistant", content: "Hel" }, done: false },
        { model: "llama3.2", created_at: "t", message: { role: "assistant", content: "lo, " }, done: false },
        { model: "llama3.2", created_at: "t", message: { role: "assistant", content: "world" }, done: false },
        { model: "llama3.2", created_at: "t", message: { role: "assistant", content: "" }, done: true },
      ]),
  });

  const ollama = ollamaWith(fetchImpl);
  const text = await collectChat(ollama, "llama3.2", "Say hello");

  assert.equal(text, "Hello, world");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${DEFAULT_HOST}/api/chat`);
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].body.stream, true);
  assert.deepEqual(calls[0].body.messages, [{ role: "user", content: "Say hello" }]);
});

test("embed posts input and returns vectors", async () => {
  const { fetchImpl, calls } = createFetch({
    "/api/embed": () =>
      jsonResponse({
        model: "nomic-embed-text",
        embeddings: [[0.1, 0.2, 0.3]],
      }),
  });

  const ollama = ollamaWith(fetchImpl);
  const result = await ollama.embed({ model: "nomic-embed-text", input: "hello world" });

  assert.deepEqual(result.embeddings, [[0.1, 0.2, 0.3]]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${DEFAULT_HOST}/api/embed`);
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].body.model, "nomic-embed-text");
  assert.equal(calls[0].body.input, "hello world");
});
