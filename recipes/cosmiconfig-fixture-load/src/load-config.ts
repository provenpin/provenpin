import { cosmiconfigSync } from "cosmiconfig";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type AppConfig = { port: number; name: string };

export function writeFixture(root: string, filename: string, data: unknown) {
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, filename), typeof data === "string" ? data : JSON.stringify(data, null, 2));
}

export function loadAppConfig(searchFrom: string): AppConfig {
  const explorer = cosmiconfigSync("demoapp", {
    searchPlaces: [".demoapprc.json", "demoapp.config.json"],
  });
  const result = explorer.search(searchFrom);
  if (!result || result.isEmpty) throw new Error("config not found");
  return result.config as AppConfig;
}
