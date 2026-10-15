import Fastify from "fastify";
import swagger from "@fastify/swagger";

export async function buildApp() {
  const app = Fastify();

  // Register swagger before routes so it sees every route schema.
  await app.register(swagger, {
    openapi: {
      openapi: "3.1.0",
      info: { title: "Parts API", version: "1.0.0" },
      components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } } },
    },
    // Name shared schemas after their $id instead of the default def-0, def-1...
    refResolver: { buildLocalReference: (json, _baseUri, _fragment, i) => String(json.$id ?? `def-${i}`) },
  });

  app.addSchema({
    $id: "Part",
    type: "object",
    required: ["id", "name"],
    properties: { id: { type: "integer" }, name: { type: "string" }, price: { type: "number" } },
  });

  const parts = [{ id: 1, name: "bolt", price: 0.25 }];

  app.get("/parts", {
    schema: {
      tags: ["parts"],
      summary: "List parts",
      querystring: { type: "object", properties: { q: { type: "string" } } },
      response: { 200: { type: "array", items: { $ref: "Part#" } } },
    },
  }, async (req) => {
    const { q } = req.query as { q?: string };
    return q ? parts.filter((p) => p.name.includes(q)) : parts;
  });

  app.post("/parts", {
    schema: {
      tags: ["parts"],
      summary: "Create a part",
      security: [{ bearerAuth: [] }],
      body: { type: "object", required: ["name"], properties: { name: { type: "string", minLength: 1 }, price: { type: "number" } } },
      response: { 201: { $ref: "Part#" } },
    },
  }, async (req, reply) => {
    const body = req.body as { name: string; price?: number };
    const part = { id: parts.length + 1, ...body };
    parts.push(part);
    return reply.code(201).send(part);
  });

  app.get("/openapi.json", { schema: { hide: true } }, async () => app.swagger());

  await app.ready();
  return app;
}
