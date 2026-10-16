declare module "proper-lockfile" {
  export interface RetryOptions {
    retries?: number;
    factor?: number;
    minTimeout?: number;
    maxTimeout?: number;
  }

  export interface LockOptions {
    stale?: number;
    update?: number;
    retries?: number | RetryOptions;
    realpath?: boolean;
    onCompromised?: (error: Error) => void;
  }

  export type Release = () => Promise<void>;

  export function lock(file: string, options?: LockOptions): Promise<Release>;
  export function lockSync(file: string, options?: LockOptions): () => void;
  export function check(file: string, options?: LockOptions): Promise<boolean>;
  export function unlock(file: string, options?: LockOptions): Promise<void>;

  const lockfile: {
    lock: typeof lock;
    lockSync: typeof lockSync;
    check: typeof check;
    unlock: typeof unlock;
  };

  export default lockfile;
}
