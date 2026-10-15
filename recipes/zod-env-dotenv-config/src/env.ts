import { config } from "dotenv";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.url(),
  FEATURE_SIGNUPS: z.stringbool().default(false),
  API_KEY: z.string().min(16),
});
export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(opts: { path?: string; source?: NodeJS.ProcessEnv } = {}): Env {
  const source = { ...(opts.source ?? process.env) };
  if (opts.path) config({ path: opts.path, processEnv: source as Record<string, string>, quiet: true });
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) throw new Error("Invalid environment:\n" + z.prettifyError(parsed.error));
  return parsed.data;
}
