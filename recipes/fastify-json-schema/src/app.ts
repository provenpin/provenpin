import Fastify from "fastify";

export function build() {
  const app = Fastify();
  app.post("/items", {
    schema: {
      body: { type: "object", required: ["name", "qty"], additionalProperties: false,
        properties: { name: { type: "string", minLength: 1 }, qty: { type: "integer", minimum: 1 } } },
      response: { 201: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" }, qty: { type: "integer" } } } },
    },
  }, async (req, reply) => {
    const body = req.body as { name: string; qty: number };
    return reply.code(201).send({ id: 1, ...body, secret: "never serialized" });
  });
  return app;
}
