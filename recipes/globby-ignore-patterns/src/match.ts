import { globby } from "globby";

export type MatchOptions = {
  patterns: string[];
  ignore?: string[];
  absolute?: boolean;
  onlyFiles?: boolean;
};

export async function matchFiles(cwd: string, options: MatchOptions): Promise<string[]> {
  const matches = await globby(options.patterns, {
    cwd,
    ignore: options.ignore,
    absolute: options.absolute,
    onlyFiles: options.onlyFiles ?? true,
  });
  return matches.map((match) => match.split("\\").join("/")).sort();
}
