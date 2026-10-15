import { Hono } from "hono";
import { vValidator } from "@hono/valibot-validator";
import * as v from "valibot";

const Signup = v.object({
  email: v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email()),
  password: v.pipe(v.string(), v.minLength(8)),
  plan: v.optional(v.picklist(["free", "pro"]), "free"),
});
const Paging = v.object({ page: v.optional(v.pipe(v.string(), v.transform(Number), v.integer(), v.minValue(1)), "1") });

export const app = new Hono()
  .post("/signup", vValidator("json", Signup, (result, c) => {
    if (!result.success) return c.json({ error: "invalid", fields: v.flatten(result.issues).nested }, 422);
  }), (c) => c.json(c.req.valid("json"), 201))
  .get("/items", vValidator("query", Paging), (c) => c.json({ page: c.req.valid("query").page }));
