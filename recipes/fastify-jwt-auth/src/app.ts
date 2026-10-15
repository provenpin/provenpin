import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import fastifyJwt from "@fastify/jwt";

export function buildApp(secret: string) {
  const app = Fastify();
  app.register(fastifyJwt, { secret });

  const authenticate = async (req: FastifyRequest, reply: FastifyReply) => {
    try { await req.jwtVerify(); } catch { return reply.code(401).send({ error: "unauthorized" }); }
  };

  app.post<{ Body: { username: string; password: string } }>("/login", {
    schema: { body: { type: "object", required: ["username", "password"], properties: { username: { type: "string" }, password: { type: "string" } } } },
  }, async (req, reply) => {
    if (req.body.password !== "secret") return reply.code(401).send({ error: "invalid_credentials" });
    return { token: app.jwt.sign({ sub: req.body.username }, { expiresIn: "1h" }) };
  });

  app.get("/me", { preHandler: authenticate }, async (req) => ({ user: (req.user as { sub: string }).sub }));
  return app;
}
