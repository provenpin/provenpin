export interface ApiClient {
  fetchJob(id: string): Promise<{ id: string; status: string }>;
}

export async function loadStatus(client: ApiClient, id: string): Promise<string> {
  const job = await client.fetchJob(id);
  return job.status;
}

export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  waitMs: number,
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, waitMs);
  };
}

export async function retry<T>(
  fn: () => Promise<T>,
  opts: { attempts: number; delayMs: number },
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= opts.attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < opts.attempts) {
        await new Promise((resolve) => setTimeout(resolve, opts.delayMs * attempt));
      }
    }
  }
  throw lastError;
}
