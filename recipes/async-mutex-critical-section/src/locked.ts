import { Mutex } from "async-mutex";

export function createLockedCounter() {
  const mutex = new Mutex();
  let value = 0;
  return {
    async increment() {
      return mutex.runExclusive(async () => {
        const next = value + 1;
        await Promise.resolve();
        value = next;
        return value;
      });
    },
    get() {
      return value;
    },
  };
}
