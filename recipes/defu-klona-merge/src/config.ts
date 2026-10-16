import { defu, createDefu } from "defu";
import { klona } from "klona";

export type Config = {
  host: string;
  port: number;
  retries: number;
  features: string[];
  tls: { enabled: boolean; cert?: string };
};

export const defaults: Config = {
  host: "localhost",
  port: 5432,
  retries: 3,
  features: ["base"],
  tls: { enabled: false },
};

export function mergeConfig(overrides: Partial<Config>): Config {
  return defu(overrides, defaults) as Config;
}

export const defuReplaceArrays = createDefu((obj, key, value) => {
  if (Array.isArray(obj[key]) || Array.isArray(value)) {
    obj[key] = value;
    return true;
  }
  return false;
});

export function mergeConfigReplaceArrays(overrides: Partial<Config>): Config {
  return defuReplaceArrays(overrides, defaults) as Config;
}

export function cloneConfig(config: Config): Config {
  return klona(config);
}
