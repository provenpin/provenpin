import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const CreateItem = z.object({
  name: z.string().min(2),
  qty: z.number().int().positive(),
});

const items: Array<{ id: number; name: string; qty: number }> = [];

export const app = new Hono()
  .post("/items", zValidator("json", CreateItem), (c) => {
    const body = c.req.valid("json");
    const item = { id: items.length + 1, ...body };
    items.push(item);
    return c.json(item, 201);
  })
  .get("/items/:id", (c) => {
    const id = Number(c.req.param("id"));
    const item = items.find((i) => i.id === id);
    if (!item) return c.json({ error: "not_found" }, 404);
    return c.json(item);
  })
  .get("/items", (c) => c.json(items));

export type AppType = typeof app;

export function reset() {
  items.length = 0;
}
