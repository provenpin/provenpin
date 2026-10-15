import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { eq } from "drizzle-orm";

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
});

export function createApp(file = ":memory:") {
  const sqlite = new Database(file);
  sqlite.exec("create table if not exists tasks (id integer primary key autoincrement, title text not null, done integer not null default 0)");
  const db = drizzle(sqlite);
  const app = new Hono();
  const Id = z.object({ id: z.coerce.number().int().positive() });

  app.get("/tasks", (c) => c.json(db.select().from(tasks).all()));
  app.post("/tasks", zValidator("json", z.object({ title: z.string().min(1) })), (c) =>
    c.json(db.insert(tasks).values(c.req.valid("json")).returning().get(), 201));
  app.patch("/tasks/:id", zValidator("param", Id), zValidator("json", z.object({ title: z.string().min(1).optional(), done: z.boolean().optional() })), (c) => {
    const row = db.update(tasks).set(c.req.valid("json")).where(eq(tasks.id, c.req.valid("param").id)).returning().get();
    return row ? c.json(row) : c.json({ error: "not_found" }, 404);
  });
  app.delete("/tasks/:id", zValidator("param", Id), (c) => {
    const r = db.delete(tasks).where(eq(tasks.id, c.req.valid("param").id)).run();
    return r.changes ? c.body(null, 204) : c.json({ error: "not_found" }, 404);
  });
  return app;
}
