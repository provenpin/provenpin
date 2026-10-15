import SchemaBuilder from "@pothos/core";
import { createYoga } from "graphql-yoga";

type Post = { id: number; title: string; published: boolean };
const posts: Post[] = [];

const builder = new SchemaBuilder<{}>({});

const PostRef = builder.objectRef<Post>("Post");
PostRef.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    title: t.exposeString("title"),
    published: t.exposeBoolean("published"),
  }),
});

builder.queryType({
  fields: (t) => ({
    posts: t.field({
      type: [PostRef],
      resolve: () => posts,
    }),
    post: t.field({
      type: PostRef,
      nullable: true,
      args: { id: t.arg.int({ required: true }) },
      resolve: (_r, { id }) => posts.find((p) => p.id === id) ?? null,
    }),
  }),
});

builder.mutationType({
  fields: (t) => ({
    createPost: t.field({
      type: PostRef,
      args: {
        title: t.arg.string({ required: true }),
        published: t.arg.boolean({ required: true }),
      },
      resolve: (_r, args) => {
        const post = { id: posts.length + 1, title: args.title, published: args.published };
        posts.push(post);
        return post;
      },
    }),
  }),
});

export const schema = builder.toSchema();
export const yoga = createYoga({ schema, graphqlEndpoint: "/graphql" });
export function reset() { posts.length = 0; }
