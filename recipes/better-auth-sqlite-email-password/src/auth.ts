import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration"; // 1.7 moved it off better-auth/db
import Database from "better-sqlite3";

/** Better Auth on an in-memory SQLite database with email/password enabled. */
export async function makeAuth() {
  const auth = betterAuth({
    database: new Database(":memory:"),
    secret: "test-secret-test-secret-test-secret-0123",
    baseURL: "http://localhost:3000",
    emailAndPassword: { enabled: true, minPasswordLength: 10 },
    telemetry: { enabled: false },
  });
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations(); // creates user/session/account/verification tables
  return auth;
}

export type Auth = Awaited<ReturnType<typeof makeAuth>>;
