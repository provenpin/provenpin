import chokidar from "chokidar";

export function watchDir(dir: string, onAdd: (path: string) => void) {
  const watcher = chokidar.watch(dir, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 20 },
  });
  watcher.on("add", onAdd);
  return watcher;
}
