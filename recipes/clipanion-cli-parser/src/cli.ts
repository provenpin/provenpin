import { Builtins, Cli, Command, Option } from "clipanion";

export class AddCommand extends Command {
  static paths = [["add"]];

  static usage = Command.Usage({
    category: "Math",
    description: "Add two integers together.",
    examples: [["Add 1 and 2", "$0 add --a 1 --b 2"]],
  });

  a = Option.String("--a", { required: true });
  b = Option.String("--b", { required: true });
  verbose = Option.Boolean("-v,--verbose", false);

  async execute(): Promise<number> {
    const left = Number(this.a);
    const right = Number(this.b);

    if (Number.isNaN(left) || Number.isNaN(right)) {
      this.context.stderr.write("error: --a and --b must be numbers\n");
      return 1;
    }

    if (this.verbose) {
      this.context.stderr.write(`verbose: ${left} + ${right}\n`);
    }

    this.context.stdout.write(`${left + right}\n`);
    return 0;
  }
}

export class GreetCommand extends Command {
  static paths = [["greet"]];

  static usage = Command.Usage({
    category: "Text",
    description: "Greet someone by name.",
    examples: [["Greet Ada", "$0 greet --name ada --shout"]],
  });

  name = Option.String("--name");
  shout = Option.Boolean("--shout", false);

  async execute(): Promise<number> {
    const message = `Hello, ${this.name ?? "world"}`;
    this.context.stdout.write(`${this.shout ? message.toUpperCase() : message}\n`);
    return 0;
  }
}

export function createCli(): Cli {
  const cli = new Cli({
    binaryLabel: "demo",
    binaryName: "demo",
    binaryVersion: "1.0.0",
  });

  cli.register(Builtins.HelpCommand);
  cli.register(Builtins.VersionCommand);
  cli.register(AddCommand);
  cli.register(GreetCommand);

  return cli;
}
