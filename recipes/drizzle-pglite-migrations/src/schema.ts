import { pgTable, pgEnum, serial, text, jsonb } from "drizzle-orm/pg-core";

export const plan = pgEnum("plan", ["free", "pro"]);
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  plan: plan("plan").notNull().default("free"),
  tags: text("tags").array().notNull().default([]),
  settings: jsonb("settings").$type<{ theme?: "dark" | "light"; beta?: boolean }>().notNull().default({}),
});
