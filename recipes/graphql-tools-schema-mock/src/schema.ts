import { makeExecutableSchema } from "@graphql-tools/schema";
import { addMocksToSchema, createMockStore, MockList } from "@graphql-tools/mock";
import { graphql, type GraphQLSchema } from "graphql";

export const typeDefs = /* GraphQL */ `
  type Course { id: ID!, title: String!, hours: Int!, instructor: Instructor!, tags: [String!]! }
  type Instructor { id: ID!, name: String!, courses: [Course!]! }
  type Query { courses(limit: Int): [Course!]!, course(id: ID!): Course, me: Instructor! }
  type Mutation { renameCourse(id: ID!, title: String!): Course! }
`;

/** Real resolvers for the parts that exist; mocks fill in the rest (handy for frontend work before the API is done). */
export function buildSchema(seed = 1) {
  const base = makeExecutableSchema({ typeDefs });
  let n = seed;
  const nextInt = () => (n = (n * 48271) % 2147483647); // deterministic PRNG instead of Math.random
  const mocks = {
    ID: () => `id-${nextInt() % 1000}`,
    Int: () => (nextInt() % 100) + 1,
    String: () => `str-${nextInt() % 1000}`,
    Course: () => ({ tags: () => new MockList(2) }),
    Instructor: () => ({ name: "Phil Morin" }),
  };
  const store = createMockStore({ schema: base, mocks });
  const schema = addMocksToSchema({
    schema: base,
    store,
    preserveResolvers: true,
    resolvers: (s) => ({
      Query: {
        courses: (_: unknown, { limit }: { limit?: number }) => Array.from({ length: limit ?? 3 }, (_, i) => s.get("Course", `c${i + 1}`)),
        course: (_: unknown, { id }: { id: string }) => (id.startsWith("c") ? s.get("Course", id) : null),
      },
      Mutation: {
        renameCourse: (_: unknown, { id, title }: { id: string; title: string }) => {
          s.set("Course", id, "title", title);
          return s.get("Course", id);
        },
      },
    }),
  });
  return { schema, store };
}

export const run = (schema: GraphQLSchema, source: string, variableValues?: Record<string, unknown>) =>
  graphql({ schema, source, variableValues }) as Promise<{ data?: any; errors?: readonly { message: string }[] }>;
