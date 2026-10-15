import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { z } from "zod";

export const DeployOpts = z.object({
  env: z.enum(["dev", "staging", "prod"]),
  tag: z.string().regex(/^v\d+\.\d+\.\d+$/),
  dryRun: z.boolean().default(false),
  regions: z.array(z.string().min(2)).min(1),
});

export type DeployOpts = z.infer<typeof DeployOpts>;

export async function parseDeploy(argv: string[]) {
  const raw = await yargs(argv)
    .scriptName("deploy")
    .option("env", { type: "string", demandOption: true })
    .option("tag", { type: "string", demandOption: true })
    .option("dry-run", { type: "boolean", default: false })
    .option("regions", { type: "array", string: true, demandOption: true })
    .exitProcess(false)
    .parseAsync();

  const parsed = DeployOpts.safeParse({
    env: raw.env,
    tag: raw.tag,
    dryRun: raw.dryRun ?? raw["dry-run"],
    regions: raw.regions,
  });
  if (!parsed.success) {
    return { ok: false as const, issues: z.flattenError(parsed.error).fieldErrors };
  }
  return { ok: true as const, data: parsed.data };
}

export function fromProcessArgv(argv = process.argv) {
  return parseDeploy(hideBin(argv));
}
