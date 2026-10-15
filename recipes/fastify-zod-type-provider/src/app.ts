import Fastify from "fastify";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

export function buildApp() {
  const app = Fastify();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.post("/users", {
    schema: {
      body: z.object({ email: z.email(), age: z.number().int().min(13) }),
      response: { 201: z.object({ id: z.number(), email: z.string() }) }, // extra fields are stripped
    },
  }, async (req, reply) => {
    const { email } = req.body; // typed from the schema
    return reply.code(201).send({ id: 1, email, passwordHash: "never-leaks" } as any);
  });

  typed.get("/search", { schema: { querystring: z.object({ q: z.string().min(1), page: z.coerce.number().int().default(1) }) } },
    async (req) => ({ q: req.query.q, page: req.query.page }));
  return app;
}
