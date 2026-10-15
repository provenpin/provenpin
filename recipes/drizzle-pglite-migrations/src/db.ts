import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { arrayContains, sql } from "drizzle-orm";
import { accounts } from "./schema.ts";

export async function freshDb() {
  const db = drizzle(new PGlite());
  await migrate(db, { migrationsFolder: "./drizzle" }); // same folder drizzle-kit generate writes
  return db;
}
type Db = Awaited<ReturnType<typeof freshDb>>;

// Upsert: insert or upgrade plan and merge settings
export const upsertAccount = (db: Db, email: string, plan: "free" | "pro", settings: Record<string, unknown>) =>
  db.insert(accounts).values({ email, plan, settings }).onConflictDoUpdate({
    target: accounts.email,
    set: { plan, settings: sql`${accounts.settings} || ${JSON.stringify(settings)}::jsonb` },
  }).returning();

export const taggedWith = (db: Db, tag: string) => db.select().from(accounts).where(arrayContains(accounts.tags, [tag]));
