import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { accounts, sessions, users, verificationTokens } from "./schema.ts";

const DDL = `
create table "user" (id text primary key, name text, email text unique, "emailVerified" timestamp, image text);
create table account ("userId" text not null references "user"(id) on delete cascade, type text not null, provider text not null,
  "providerAccountId" text not null, refresh_token text, access_token text, expires_at integer, token_type text, scope text,
  id_token text, session_state text, primary key (provider, "providerAccountId"));
create table session ("sessionToken" text primary key, "userId" text not null references "user"(id) on delete cascade, expires timestamp not null);
create table "verificationToken" (identifier text not null, token text not null, expires timestamp not null, primary key (identifier, token));`;

export async function createAdapter() {
  const client = new PGlite();
  await client.exec(DDL); // use drizzle-kit migrations in a real app
  const db = drizzle(client);
  // pass this to NextAuth({ adapter, session: { strategy: "database" }, providers: [...] })
  return DrizzleAdapter(db, { usersTable: users, accountsTable: accounts, sessionsTable: sessions, verificationTokensTable: verificationTokens });
}
