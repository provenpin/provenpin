import {
  GraphQLError,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
  Kind,
} from "graphql";

export const GraphQLDate = new GraphQLScalarType<Date, string>({
  name: "Date",
  description: "An ISO-8601 encoded UTC date time string.",
  serialize(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }
    throw new GraphQLError(`Date cannot represent value: ${String(value)}`);
  },
  parseValue(value) {
    if (typeof value === "string") {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
    throw new GraphQLError(`Date cannot represent value: ${String(value)}`);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      const date = new Date(ast.value);
      if (!Number.isNaN(date.getTime())) {
        return date;
      }
    }
    throw new GraphQLError("Date cannot represent a non-string value");
  },
});

export type User = {
  id: string;
  name: string;
  createdAt: Date;
};

const users = new Map<string, User>([
  ["1", { id: "1", name: "Ada", createdAt: new Date("2020-01-01T00:00:00.000Z") }],
  ["2", { id: "2", name: "Alan", createdAt: new Date("2021-06-15T12:30:00.000Z") }],
]);

export const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    createdAt: { type: new GraphQLNonNull(GraphQLDate) },
  }),
});

export const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: {
      user: {
        type: UserType,
        args: { id: { type: new GraphQLNonNull(GraphQLString) } },
        resolve: (_source, args: { id: string }) => users.get(args.id) ?? null,
      },
      users: {
        type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserType))),
        resolve: () => [...users.values()],
      },
      failing: {
        type: GraphQLString,
        resolve: () => {
          throw new Error("resolver exploded");
        },
      },
    },
  }),
});
