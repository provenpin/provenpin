import knexFactory, { type Knex } from "knex";

type Migration = { up: (k: Knex) => Promise<void>; down: (k: Knex) => Promise<void> };

/** Migrations kept in code. A custom migrationSource avoids loader quirks with .ts files on disk. */
export const migrations: Record<string, Migration> = {
  "20261001_create_users": {
    up: (k) => k.schema.createTable("users", (t) => {
      t.increments("id");
      t.string("email").notNullable().unique();
      t.string("name").notNullable();
      t.timestamp("created_at").notNullable().defaultTo(k.fn.now());
    }),
    down: (k) => k.schema.dropTable("users"),
  },
  "20261008_create_posts": {
    up: (k) => k.schema.createTable("posts", (t) => {
      t.increments("id");
      t.integer("user_id").notNullable().references("id").inTable("users").onDelete("CASCADE");
      t.string("title").notNullable();
      t.boolean("published").notNullable().defaultTo(false);
      t.index(["user_id", "published"]);
    }),
    down: (k) => k.schema.dropTable("posts"),
  },
  "20261012_users_add_role": {
    up: (k) => k.schema.alterTable("users", (t) => { t.string("role").notNullable().defaultTo("member"); }),
    down: (k) => k.schema.alterTable("users", (t) => { t.dropColumn("role"); }),
  },
};

const migrationSource: Knex.MigrationSource<string> = {
  getMigrations: async () => Object.keys(migrations).sort(),
  getMigrationName: (name) => name,
  getMigration: async (name) => migrations[name],
};

export function createDb(filename = ":memory:") {
  return knexFactory({
    client: "better-sqlite3",
    connection: { filename },
    useNullAsDefault: true,
    // SQLite has foreign keys off by default; turn them on for every pooled connection.
    pool: { afterCreate: (conn: { pragma: (s: string) => void }, done: (err: Error | null, conn: unknown) => void) => { conn.pragma("foreign_keys = ON"); done(null, conn); } },
    migrations: { migrationSource },
  });
}

export async function seed(k: Knex) {
  await k.transaction(async (trx) => {
    const [ada] = await trx("users").insert({ email: "ada@example.test", name: "Ada", role: "admin" }).returning("id");
    const [bob] = await trx("users").insert({ email: "bob@example.test", name: "Bob" }).returning("id");
    await trx("posts").insert([
      { user_id: ada.id, title: "Engines", published: true },
      // multi-row inserts fill missing columns with NULL (useNullAsDefault), so be explicit
      { user_id: ada.id, title: "Draft notes", published: false },
      { user_id: bob.id, title: "Hello", published: true },
    ]);
  });
}

/** Published post counts per author, a typical join plus group by. */
export function publishedCounts(k: Knex) {
  return k("users as u")
    .leftJoin("posts as p", function () { this.on("p.user_id", "u.id").andOn("p.published", k.raw("?", [1])); })
    .select("u.name")
    .count({ published: "p.id" })
    .groupBy("u.id")
    .orderBy("u.name");
}
