import { Hono } from "hono";
import { jwt, sign } from "hono/jwt";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const Login = z.object({ username: z.string().min(1), password: z.string().min(1) });
const USERS: Record<string, string> = { ada: "lovelace" }; // swap for a real user store

export function createApp(secret: string) {
  const app = new Hono();
  app.post("/login", zValidator("json", Login), async (c) => {
    const { username, password } = c.req.valid("json");
    if (USERS[username] !== password) return c.json({ error: "invalid_credentials" }, 401);
    const token = await sign({ sub: username, exp: Math.floor(Date.now() / 1000) + 3600 }, secret, "HS256");
    return c.json({ token });
  });
  app.use("/me/*", jwt({ secret, alg: "HS256" }));
  app.get("/me/profile", (c) => c.json({ user: c.get("jwtPayload").sub }));
  return app;
}
