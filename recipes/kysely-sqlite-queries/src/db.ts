import Database from "better-sqlite3";
import { Kysely, SqliteDialect, type Generated } from "kysely";

interface DB {
  author: { id: Generated<number>; name: string };
  book: { id: Generated<number>; author_id: number; title: string };
}

export async function createDb() {
  const db = new Kysely<DB>({ dialect: new SqliteDialect({ database: new Database(":memory:") }) });
  await db.schema.createTable("author").addColumn("id", "integer", (c) => c.primaryKey().autoIncrement()).addColumn("name", "text", (c) => c.notNull()).execute();
  await db.schema.createTable("book").addColumn("id", "integer", (c) => c.primaryKey().autoIncrement())
    .addColumn("author_id", "integer", (c) => c.notNull().references("author.id")).addColumn("title", "text", (c) => c.notNull()).execute();
  return db;
}

export async function addAuthorWithBooks(db: Kysely<DB>, name: string, titles: string[]) {
  return db.transaction().execute(async (trx) => {
    const { id } = await trx.insertInto("author").values({ name }).returning("id").executeTakeFirstOrThrow();
    for (const title of titles) await trx.insertInto("book").values({ author_id: id, title }).execute();
    return id;
  });
}

export const booksByAuthor = (db: Kysely<DB>, name: string) =>
  db.selectFrom("book").innerJoin("author", "author.id", "book.author_id").select(["book.title"]).where("author.name", "=", name).orderBy("book.title").execute();
