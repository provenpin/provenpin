import JSON5 from "json5";

export type Config = {
  name: string;
  retries: number;
  tags: string[];
  nested: { enabled: boolean; mask: number };
};

export function parseConfig(text: string): Config {
  return JSON5.parse(text) as Config;
}

export function stringifyConfig(config: Config, space: number | string = 2): string {
  return JSON5.stringify(config, null, space);
}
