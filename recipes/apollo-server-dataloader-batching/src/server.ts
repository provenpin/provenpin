import { ApolloServer } from "@apollo/server";
import { GraphQLError } from "graphql";
import DataLoader from "dataloader";

type Author = { id: string; name: string };
type Book = { id: string; title: string; authorId: string };

export const typeDefs = `#graphql
  type Author { id: ID!, name: String!, books: [Book!]! }
  type Book { id: ID!, title: String!, author: Author! }
  type Query { books: [Book!]!, author(id: ID!): Author }
  type Mutation { addBook(title: String!, authorId: ID!): Book! }
`;

/** Fake data source that records every batch call so tests can prove N+1 is gone. */
export function createDb() {
  const authors: Author[] = [{ id: "a1", name: "Ursula" }, { id: "a2", name: "Octavia" }, { id: "a3", name: "Iain" }];
  const books: Book[] = [
    { id: "b1", title: "The Dispossessed", authorId: "a1" },
    { id: "b2", title: "Kindred", authorId: "a2" },
    { id: "b3", title: "The Left Hand of Darkness", authorId: "a1" },
    { id: "b4", title: "Consider Phlebas", authorId: "a3" },
  ];
  const calls: string[][] = [];
  return {
    books, calls,
    authorsByIds: async (ids: readonly string[]) => { calls.push([...ids]); return ids.map((id) => authors.find((a) => a.id === id) ?? new Error(`author ${id} not found`)); },
    booksByAuthorIds: async (ids: readonly string[]) => ids.map((id) => books.filter((b) => b.authorId === id)),
  };
}
export type Db = ReturnType<typeof createDb>;

/** Loaders are created per request, so the cache never leaks between users. */
export function createContext(db: Db, user?: string) {
  return {
    db, user,
    loaders: {
      author: new DataLoader<string, Author>((ids) => db.authorsByIds(ids)),
      booksByAuthor: new DataLoader<string, Book[]>((ids) => db.booksByAuthorIds(ids)),
    },
  };
}
export type Ctx = ReturnType<typeof createContext>;

export const resolvers = {
  Query: {
    books: (_: unknown, __: unknown, ctx: Ctx) => ctx.db.books,
    author: (_: unknown, { id }: { id: string }, ctx: Ctx) => ctx.loaders.author.load(id).catch(() => null),
  },
  Book: { author: (b: Book, _: unknown, ctx: Ctx) => ctx.loaders.author.load(b.authorId) },
  Author: { books: (a: Author, _: unknown, ctx: Ctx) => ctx.loaders.booksByAuthor.load(a.id) },
  Mutation: {
    addBook: async (_: unknown, args: { title: string; authorId: string }, ctx: Ctx) => {
      if (!ctx.user) throw new GraphQLError("sign in first", { extensions: { code: "UNAUTHENTICATED" } });
      await ctx.loaders.author.load(args.authorId).catch(() => {
        throw new GraphQLError("unknown author", { extensions: { code: "BAD_USER_INPUT", field: "authorId" } });
      });
      const book = { id: `b${ctx.db.books.length + 1}`, ...args };
      ctx.db.books.push(book);
      ctx.loaders.booksByAuthor.clear(args.authorId); // invalidate the per-request cache after a write
      return book;
    },
  },
};

export const createServer = () => new ApolloServer<Ctx>({ typeDefs, resolvers });
