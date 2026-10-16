import lockfile from "proper-lockfile";

export type Release = () => Promise<void>;

export interface AcquireOptions {
  retries?: number;
  stale?: number;
}

export function acquire(file: string, options: AcquireOptions = {}): Promise<Release> {
  return lockfile.lock(file, {
    retries: options.retries ?? 0,
    stale: options.stale ?? 10000,
  });
}

export function acquireWithRetry(file: string, retries = 100): Promise<Release> {
  return lockfile.lock(file, {
    stale: 10000,
    retries: { retries, factor: 1, minTimeout: 10, maxTimeout: 20 },
  });
}

export function acquireSync(file: string, stale = 10000): () => void {
  return lockfile.lockSync(file, { stale });
}

export async function isLocked(file: string, stale = 10000): Promise<boolean> {
  return lockfile.check(file, { stale });
}
