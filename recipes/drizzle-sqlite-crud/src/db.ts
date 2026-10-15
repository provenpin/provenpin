import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { eq } from "drizzle-orm";

export const todos = sqliteTable("todos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
});

export function createDb(file = ":memory:") {
  const sqlite = new Database(file);
  sqlite.exec(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0)`);
  return drizzle(sqlite);
}

export type Db = ReturnType<typeof createDb>;
export const addTodo = (db: Db, title: string) => db.insert(todos).values({ title }).returning().get();
export const listTodos = (db: Db) => db.select().from(todos).all();
export const completeTodo = (db: Db, id: number) => db.update(todos).set({ done: true }).where(eq(todos.id, id)).returning().get();
export const deleteTodo = (db: Db, id: number) => db.delete(todos).where(eq(todos.id, id)).run();
