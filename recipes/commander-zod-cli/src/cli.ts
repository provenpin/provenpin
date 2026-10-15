import { Command, CommanderError, InvalidArgumentError, Option } from "commander";
import { z } from "zod";

export type Note = { id: number; text: string; tags: string[]; priority: "low" | "normal" | "high" };

const AddOpts = z.object({
  tag: z.array(z.string().regex(/^[a-z0-9-]+$/, "tags are lowercase kebab-case")).default([]),
  priority: z.enum(["low", "normal", "high"]),
});

/** commander argParser that funnels a Zod schema into commander's own error reporting. */
function zodArg<T>(schema: z.ZodType<T>) {
  return (value: string) => {
    const r = schema.safeParse(value);
    if (!r.success) throw new InvalidArgumentError(r.error.issues[0].message);
    return r.data;
  };
}

/**
 * Builds the CLI around an injected store and output sinks so tests can run it in-process.
 * exitOverride turns process.exit into a thrown CommanderError.
 */
export function buildCli(store: Note[], out: (s: string) => void, err: (s: string) => void) {
  const program = new Command("notes")
    .description("tiny notes CLI")
    .version("1.0.0")
    .exitOverride()
    .configureOutput({ writeOut: out, writeErr: err });

  program.command("add")
    .description("add a note")
    .argument("<text...>", "note text")
    .option("-t, --tag <tag>", "tag (repeatable)", (v: string, prev: string[] = []) => [...prev, v])
    .addOption(new Option("-p, --priority <level>", "priority").choices(["low", "normal", "high"]).default("normal"))
    .action((words: string[], opts: unknown) => {
      const parsed = AddOpts.safeParse(opts);
      if (!parsed.success) program.error(`error: ${parsed.error.issues[0].message}`, { exitCode: 2, code: "notes.invalid" });
      const note: Note = { id: store.length + 1, text: words.join(" "), tags: parsed.data!.tag, priority: parsed.data!.priority };
      store.push(note);
      out(`added #${note.id}\n`);
    });

  program.command("list")
    .description("list notes")
    .option("--json", "print JSON")
    .option("--min <n>", "show at most n notes", zodArg(z.coerce.number().int().positive()))
    .action((opts: { json?: boolean; min?: number }) => {
      const notes = opts.min ? store.slice(0, opts.min) : store;
      if (opts.json) out(JSON.stringify(notes) + "\n");
      else for (const n of notes) out(`#${n.id} [${n.priority}] ${n.text}${n.tags.length ? " #" + n.tags.join(" #") : ""}\n`);
    });

  return program;
}

/** Runs argv (without node and script) and returns an exit code instead of exiting. */
export async function run(argv: string[], store: Note[] = []) {
  let stdout = "", stderr = "";
  const program = buildCli(store, (s) => (stdout += s), (s) => (stderr += s));
  try {
    await program.parseAsync(argv, { from: "user" });
    return { code: 0, stdout, stderr, store };
  } catch (e) {
    if (e instanceof CommanderError) return { code: e.exitCode, stdout, stderr, store, errorCode: e.code };
    throw e;
  }
}
