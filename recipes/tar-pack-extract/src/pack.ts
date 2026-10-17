import * as fs from "node:fs";
import * as path from "node:path";
import * as tar from "tar";

export type Tree = Record<string, string>;

export function writeTree(root: string, tree: Tree): void {
  for (const [rel, contents] of Object.entries(tree)) {
    const target = path.join(root, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents, "utf8");
  }
}

export function createTarball(sourceDir: string, tarball: string, entries: string[]): void {
  tar.create(
    {
      cwd: sourceDir,
      file: tarball,
      gzip: true,
      sync: true,
    },
    entries,
  );
}

export function listEntries(tarball: string): string[] {
  const names: string[] = [];
  tar.list({
    file: tarball,
    sync: true,
    onReadEntry: (entry) => {
      names.push(entry.path);
    },
  });
  return names;
}

export type ExtractOptions = {
  strip?: number;
  filter?: (entryPath: string) => boolean;
};

export function extractTarball(tarball: string, destDir: string, options: ExtractOptions = {}): void {
  fs.mkdirSync(destDir, { recursive: true });
  tar.extract({
    file: tarball,
    cwd: destDir,
    strip: options.strip,
    filter: options.filter,
    sync: true,
  });
}
