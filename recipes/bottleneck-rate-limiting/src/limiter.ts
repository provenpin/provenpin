import Bottleneck from "bottleneck";

export function createLimiter(opts: { maxConcurrent?: number; minTime?: number; retries?: number; retryDelay?: number } = {}) {
  const limiter = new Bottleneck({ maxConcurrent: opts.maxConcurrent ?? 1, minTime: opts.minTime ?? 0 });
  const retries = opts.retries ?? 0;

  // Returning a number from "failed" tells Bottleneck to retry the job after that many ms.
  limiter.on("failed", (error: Error & { status?: number }, info) => {
    if (error.status === 429 && info.retryCount < retries) return opts.retryDelay ?? 5;
    return undefined;
  });

  return limiter;
}

export type Call = { at: number; id: string };

export async function callAll(limiter: Bottleneck, ids: string[], work: (id: string) => Promise<void>) {
  return Promise.all(ids.map((id) => limiter.schedule(() => work(id))));
}
