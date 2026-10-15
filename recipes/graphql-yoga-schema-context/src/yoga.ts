import { createSchema, createYoga } from "graphql-yoga";
import { GraphQLError } from "graphql";

type Ctx = { userId: string | null };
const books = [{ id: "1", title: "SICP", ownerId: "ada" }];

export const yoga = createYoga<{}, Ctx>({
  context: ({ request }) => ({ userId: request.headers.get("x-user-id") }),
  schema: createSchema<Ctx>({
    typeDefs: /* GraphQL */ `
      type Book { id: ID!, title: String! }
      type Query { books: [Book!]!, myBooks: [Book!]! }
      type Mutation { addBook(title: String!): Book! }
    `,
    resolvers: {
      Query: {
        books: () => books,
        myBooks: (_p, _a, ctx) => {
          if (!ctx.userId) throw new GraphQLError("Sign in first", { extensions: { code: "UNAUTHENTICATED" } });
          return books.filter((b) => b.ownerId === ctx.userId);
        },
      },
      Mutation: {
        addBook: (_p, { title }: { title: string }, ctx) => {
          if (!ctx.userId) throw new GraphQLError("Sign in first", { extensions: { code: "UNAUTHENTICATED" } });
          const b = { id: String(books.length + 1), title, ownerId: ctx.userId };
          books.push(b);
          return b;
        },
      },
    },
  }),
  maskedErrors: true, // unexpected errors are hidden; GraphQLError messages pass through
});
