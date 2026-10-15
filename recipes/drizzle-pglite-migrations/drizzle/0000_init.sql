CREATE TYPE "plan" AS ENUM('free', 'pro');
--> statement-breakpoint
CREATE TABLE "accounts" (
  "id" serial PRIMARY KEY,
  "email" text NOT NULL UNIQUE,
  "plan" "plan" DEFAULT 'free' NOT NULL,
  "tags" text[] DEFAULT '{}' NOT NULL,
  "settings" jsonb DEFAULT '{}'::jsonb NOT NULL
);
