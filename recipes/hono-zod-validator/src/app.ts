import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const Post = z.object({ title: z.string().min(3), body: z.string() });
const Page = z.object({ page: z.coerce.number().int().min(1).default(1) });

export const app = new Hono()
  .post("/posts", zValidator("json", Post), (c) => c.json({ ok: true, post: c.req.valid("json") }, 201))
  .get("/posts", zValidator("query", Page), (c) => c.json({ page: c.req.valid("query").page }));
