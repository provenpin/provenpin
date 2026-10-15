import { MikroORM, defineConfig, ref } from "@mikro-orm/sqlite";
import { Author, AuthorSchema, Book, BookSchema } from "./entities.ts";

export async function createOrm() {
  const orm = await MikroORM.init(defineConfig({
    entities: [AuthorSchema, BookSchema],
    dbName: ":memory:",
    allowGlobalContext: true,
  }));
  await orm.schema.create();
  return orm;
}

export async function addAuthorWithBooks(orm: Awaited<ReturnType<typeof createOrm>>, email: string, titles: string[]) {
  const em = orm.em.fork();
  const author = em.create(Author, { email });
  for (const title of titles) em.create(Book, { title, author: ref(author) });
  await em.flush();
  return author.id;
}

export async function listBooks(orm: Awaited<ReturnType<typeof createOrm>>, email: string) {
  const em = orm.em.fork();
  const author = await em.findOne(Author, { email }, { populate: ["books"] });
  return author?.books.getItems().map((b) => b.title).sort() ?? [];
}
