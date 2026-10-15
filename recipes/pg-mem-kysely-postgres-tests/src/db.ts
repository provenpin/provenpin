import { newDb, DataType } from "pg-mem";
import { Kysely, PostgresDialect, sql, type Generated } from "kysely";

export interface DB {
  courses: { id: Generated<number>; slug: string; title: string; hours: number; created_at: Generated<Date> };
  enrollments: { id: Generated<number>; course_id: number; email: string };
}

/** In-memory Postgres (pg-mem) wired to Kysely through pg-mem's node-postgres adapter. */
export function makeDb() {
  const mem = newDb();
  // Freeze now(): built-ins live in pg_catalog, so override there (public.registerFunction is shadowed).
  mem.getSchema("pg_catalog").registerFunction({ name: "now", returns: DataType.timestamptz, implementation: () => new Date("2026-10-15T20:00:00Z"), impure: true }, true);
  mem.public.none(`
    create table courses (id serial primary key, slug text not null unique, title text not null, hours int not null check (hours < 120), created_at timestamptz not null default now());
    create table enrollments (id serial primary key, course_id int not null references courses(id), email text not null, unique (course_id, email));
  `);
  const { Pool } = mem.adapters.createPg();
  const db = new Kysely<DB>({ dialect: new PostgresDialect({ pool: new Pool() }) });
  return { db, mem };
}

export async function addCourse(db: Kysely<DB>, slug: string, title: string, hours: number) {
  return db.insertInto("courses").values({ slug, title, hours }).returning(["id", "slug", "created_at"]).executeTakeFirstOrThrow();
}

/**
 * One multi-row INSERT is atomic on real Postgres and on pg-mem. Note: pg-mem does NOT undo
 * earlier statements when a multi-query transaction (BEGIN ... ROLLBACK over separate queries)
 * fails, so keep must-be-atomic writes in a single statement or use mem.backup() in tests.
 */
export async function enroll(db: Kysely<DB>, slug: string, emails: string[]) {
  const c = await db.selectFrom("courses").select("id").where("slug", "=", slug).executeTakeFirstOrThrow();
  const rows = await db.insertInto("enrollments").values(emails.map((email) => ({ course_id: c.id, email }))).returning("id").execute();
  return rows.length;
}

export async function enrollOneByOneInTransaction(db: Kysely<DB>, slug: string, emails: string[]) {
  return db.transaction().execute(async (trx) => {
    const c = await trx.selectFrom("courses").select("id").where("slug", "=", slug).executeTakeFirstOrThrow();
    for (const email of emails) await trx.insertInto("enrollments").values({ course_id: c.id, email }).execute();
    return emails.length;
  });
}

export async function roster(db: Kysely<DB>) {
  return db
    .selectFrom("courses as c")
    .leftJoin("enrollments as e", "e.course_id", "c.id")
    .select(["c.slug", sql<number>`count(e.id)::int`.as("students")])
    .groupBy("c.slug")
    .orderBy("c.slug")
    .execute();
}
