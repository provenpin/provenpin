import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

const User = z.object({ id: z.string().openapi({ example: "u_1" }), name: z.string() }).openapi("User");
const Params = z.object({ id: z.string().min(3).openapi({ param: { name: "id", in: "path" }, example: "u_1" }) });

const getUser = createRoute({
  method: "get",
  path: "/users/{id}",
  request: { params: Params },
  responses: {
    200: { content: { "application/json": { schema: User } }, description: "The user" },
    404: { content: { "application/json": { schema: z.object({ error: z.string() }) } }, description: "Not found" },
  },
});

const db: Record<string, { id: string; name: string }> = { u_1: { id: "u_1", name: "Ada" } };

export const app = new OpenAPIHono();
app.openapi(getUser, (c) => {
  const { id } = c.req.valid("param");
  const u = db[id];
  return u ? c.json(u, 200) : c.json({ error: "not_found" }, 404);
});
app.doc31("/doc", { openapi: "3.1.0", info: { title: "Users API", version: "1.0.0" } });
