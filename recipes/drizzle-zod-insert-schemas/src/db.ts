import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  priceCents: integer("price_cents").notNull(),
  sku: text("sku").notNull(),
});

// Refine generated schemas instead of hand-writing a second copy of the table.
export const insertProduct = createInsertSchema(products, {
  name: (s) => s.min(2).max(100),
  priceCents: (s) => s.int().positive(),
  sku: (s) => s.regex(/^[A-Z]{3}-\d{4}$/),
}).omit({ id: true });
export const selectProduct = createSelectSchema(products);
export type NewProduct = z.infer<typeof insertProduct>;

export function createDb() {
  const sqlite = new Database(":memory:");
  sqlite.exec("create table products (id integer primary key autoincrement, name text not null, price_cents integer not null, sku text not null)");
  return drizzle(sqlite);
}

export function addProduct(db: ReturnType<typeof createDb>, input: unknown) {
  const data = insertProduct.parse(input);
  return selectProduct.parse(db.insert(products).values(data).returning().get());
}
