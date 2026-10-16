import fs from "fs-extra";
import os from "node:os";
import path from "node:path";

export type Config = {
  name: string;
  version: number;
  tags: string[];
};

export async function makeTempDir(prefix = "fsx-"): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function createTree(
  base: string,
): Promise<{ sourceDir: string; configPath: string }> {
  const sourceDir = path.join(base, "source");
  const configPath = path.join(sourceDir, "config.json");
  await fs.ensureDir(sourceDir);
  const config: Config = { name: "provenpin", version: 1, tags: ["a", "b"] };
  await fs.writeJson(configPath, config);
  return { sourceDir, configPath };
}

export async function readConfig(configPath: string): Promise<Config> {
  return (await fs.readJson(configPath)) as Config;
}

export async function copyTree(from: string, to: string): Promise<void> {
  await fs.copy(from, to);
}

export async function moveTree(from: string, to: string): Promise<void> {
  await fs.move(from, to, { overwrite: true });
}

export async function exists(target: string): Promise<boolean> {
  return fs.pathExists(target);
}

export async function removeTree(target: string): Promise<void> {
  await fs.remove(target);
}
