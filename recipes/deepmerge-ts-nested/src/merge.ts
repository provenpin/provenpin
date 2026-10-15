import { deepmerge } from "deepmerge-ts";

export type Settings = {
  app: { name: string; port: number };
  features: string[];
  nested: { a: number; b?: number };
};

export function mergeSettings(...parts: Array<Partial<Settings>>) {
  return deepmerge(...parts) as Settings;
}
