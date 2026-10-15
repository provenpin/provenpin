import { Cron } from "croner";
import { z } from "zod";

/** Job config as it might come from a JSON or YAML file. The cron pattern is checked by croner itself. */
export const JobConfig = z.object({
  name: z.string().regex(/^[a-z][a-z0-9-]*$/),
  schedule: z.string().refine((p) => {
    try { new Cron(p, { paused: true }).stop(); return true; } catch { return false; }
  }, "invalid cron pattern"),
  timezone: z.string().default("UTC").refine((tz) => {
    try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; }
  }, "unknown IANA timezone"),
  maxRuns: z.number().int().positive().optional(),
});
export type JobConfig = z.infer<typeof JobConfig>;

export const SchedulerConfig = z.object({ jobs: z.array(JobConfig).min(1) }).refine(
  (c) => new Set(c.jobs.map((j) => j.name)).size === c.jobs.length,
  { message: "job names must be unique", path: ["jobs"] },
);

/** Next n run times as ISO strings, without starting a timer. */
export function previewRuns(job: JobConfig, n: number, from: Date): string[] {
  const c = new Cron(job.schedule, { timezone: job.timezone, paused: true });
  const runs = c.nextRuns(n, from).map((d) => d.toISOString());
  c.stop();
  return runs;
}

/** Starts croner jobs; protect: true skips a tick if the previous run is still going. */
export function startScheduler(input: unknown, handlers: Record<string, () => unknown | Promise<unknown>>) {
  const config = SchedulerConfig.parse(input);
  const missing = config.jobs.filter((j) => !handlers[j.name]).map((j) => j.name);
  if (missing.length) throw new Error(`no handler for: ${missing.join(", ")}`);
  const crons = config.jobs.map((j) => new Cron(j.schedule, { name: j.name, timezone: j.timezone, maxRuns: j.maxRuns, protect: true }, handlers[j.name]));
  return {
    jobs: crons,
    stopAll: () => crons.forEach((c) => c.stop()),
  };
}
