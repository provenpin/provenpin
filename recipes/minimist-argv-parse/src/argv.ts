import minimist from "minimist";

export type ParsedCli = {
  name: string;
  verbose: boolean;
  _: (string | number)[];
  "--"?: string[];
  [key: string]: unknown;
};

export function parseCli(argv: string[]): ParsedCli {
  const parsed = minimist(argv, {
    string: ["name"],
    boolean: ["verbose"],
    alias: { v: "verbose", n: "name" },
    default: { name: "world", verbose: false },
    "--": true,
  });
  return parsed as ParsedCli;
}
