import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { eq, sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull().references(() => users.id),
  title: text("title").notNull(),
});

export async function createDb() {
  const client = new PGlite(); // in-memory; pass a dir path to persist
  const db = drizzle(client);
  // In a real app use drizzle-kit migrations; inline DDL keeps the recipe self-contained.
  await db.execute(sql`create table users (id serial primary key, email text not null unique, created_at timestamp not null default now())`);
  await db.execute(sql`create table posts (id serial primary key, author_id integer not null references users(id), title text not null)`);
  return { db, client };
}

export async function createUserWithPost(db: Awaited<ReturnType<typeof createDb>>["db"], email: string, title: string) {
  return db.transaction(async (tx) => {
    const [u] = await tx.insert(users).values({ email }).returning();
    await tx.insert(posts).values({ authorId: u.id, title });
    return u;
  });
}

export const postsByEmail = (db: Awaited<ReturnType<typeof createDb>>["db"], email: string) =>
  db.select({ title: posts.title }).from(posts).innerJoin(users, eq(users.id, posts.authorId)).where(eq(users.email, email));
