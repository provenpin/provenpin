import Knex from "knex";
import { Model } from "objection";

export class User extends Model {
  id!: number;
  email!: string;
  posts?: Post[];
  static tableName = "users";
  static relationMappings = {
    posts: {
      relation: Model.HasManyRelation,
      modelClass: () => Post,
      join: { from: "users.id", to: "posts.userId" },
    },
  };
}

export class Post extends Model {
  id!: number;
  title!: string;
  userId!: number;
  static tableName = "posts";
}

export async function createDb() {
  const knex = Knex({
    client: "better-sqlite3",
    connection: { filename: ":memory:" },
    useNullAsDefault: true,
  });
  Model.knex(knex);
  await knex.schema.createTable("users", (t) => {
    t.increments("id").primary();
    t.string("email").notNullable().unique();
  });
  await knex.schema.createTable("posts", (t) => {
    t.increments("id").primary();
    t.string("title").notNullable();
    t.integer("userId").notNullable().references("users.id");
  });
  return knex;
}

export async function createUserWithPosts(email: string, titles: string[]) {
  return User.query().insertGraph({
    email,
    posts: titles.map((title) => ({ title })),
  });
}
