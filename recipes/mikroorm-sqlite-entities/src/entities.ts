import { Collection, EntitySchema, type Ref } from "@mikro-orm/sqlite";

export class Author {
  id!: number;
  email!: string;
  books = new Collection<Book>(this);
}

export class Book {
  id!: number;
  title!: string;
  author!: Ref<Author>;
}

export const AuthorSchema = new EntitySchema<Author>({
  class: Author,
  properties: {
    id: { type: "number", primary: true, autoincrement: true },
    email: { type: "string", unique: true },
    books: { kind: "1:m", entity: () => Book, mappedBy: "author" },
  },
});

export const BookSchema = new EntitySchema<Book>({
  class: Book,
  properties: {
    id: { type: "number", primary: true, autoincrement: true },
    title: { type: "string" },
    author: { kind: "m:1", entity: () => Author, ref: true },
  },
});
