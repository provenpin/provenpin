import Koa from "koa";
import Router from "@koa/router";
import { bodyParser } from "@koa/bodyparser";
import { z } from "zod";

export const NewTodo = z.object({
  title: z.string().trim().min(1, "title is required").max(200),
  done: z.boolean().default(false),
});
export type Todo = z.infer<typeof NewTodo> & { id: number };

const IdParam = z.coerce.number().int().positive();

/** Builds a Koa app with an in-memory todo store. A fresh app per test keeps state isolated. */
export function createApp() {
  const todos = new Map<number, Todo>();
  let nextId = 1;
  const app = new Koa();
  const router = new Router({ prefix: "/todos" });

  // Central error handler: Zod errors become 400 with field issues, everything else 500.
  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        ctx.status = 400;
        ctx.body = { error: "validation_failed", issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })) };
      } else {
        ctx.status = (err as { status?: number }).status ?? 500;
        ctx.body = { error: (err as Error).message };
      }
    }
  });

  router.get("/", (ctx) => {
    const done = ctx.query.done;
    let list = [...todos.values()];
    if (done === "true" || done === "false") list = list.filter((t) => t.done === (done === "true"));
    ctx.body = list;
  });

  router.post("/", (ctx) => {
    const input = NewTodo.parse(ctx.request.body);
    const todo = { id: nextId++, ...input };
    todos.set(todo.id, todo);
    ctx.status = 201;
    ctx.set("Location", `/todos/${todo.id}`);
    ctx.body = todo;
  });

  router.patch("/:id", (ctx) => {
    const id = IdParam.parse(ctx.params.id);
    const todo = todos.get(id);
    if (!todo) ctx.throw(404, "todo not found");
    const patch = NewTodo.partial().parse(ctx.request.body);
    const updated = { ...todo!, ...patch };
    todos.set(id, updated);
    ctx.body = updated;
  });

  router.delete("/:id", (ctx) => {
    const id = IdParam.parse(ctx.params.id);
    if (!todos.delete(id)) ctx.throw(404, "todo not found");
    ctx.status = 204;
  });

  app.use(bodyParser());
  app.use(router.routes());
  app.use(router.allowedMethods());
  return app;
}
