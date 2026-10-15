import { load } from "js-yaml";
import { z } from "zod";

export const AppConfig = z.object({
  name: z.string().min(1),
  port: z.number().int().min(1).max(65535).default(3000),
  features: z.object({
    billing: z.boolean().default(false),
    beta: z.boolean().default(false),
  }).default({ billing: false, beta: false }),
  database: z.object({
    url: z.string().min(1),
    pool: z.number().int().positive().default(5),
  }),
});

export type AppConfig = z.infer<typeof AppConfig>;

export function loadConfig(source: string): AppConfig {
  const raw = load(source);
  return AppConfig.parse(raw);
}

export function safeLoadConfig(source: string) {
  const raw = load(source);
  const r = AppConfig.safeParse(raw);
  if (!r.success) return { ok: false as const, issues: z.flattenError(r.error).fieldErrors };
  return { ok: true as const, data: r.data };
}
