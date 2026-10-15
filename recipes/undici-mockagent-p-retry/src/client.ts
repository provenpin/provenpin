import { request, type Dispatcher } from "undici";
import pRetry, { AbortError } from "p-retry";

export class HttpError extends Error {
  constructor(public status: number, public body: string) { super(`HTTP ${status}`); }
}

export type ClientOptions = { baseUrl: string; dispatcher?: Dispatcher; retries?: number; minTimeout?: number };

/** A JSON API client on undici.request with p-retry: retries 429/5xx and network errors, never other 4xx. */
export function createClient({ baseUrl, dispatcher, retries = 3, minTimeout = 10 }: ClientOptions) {
  const attempts: number[] = [];

  async function getJson<T>(path: string): Promise<T> {
    return pRetry(async (attempt) => {
      attempts.push(attempt);
      const res = await request(new URL(path, baseUrl), { method: "GET", dispatcher, headers: { accept: "application/json" } });
      const text = await res.body.text();
      if (res.statusCode >= 200 && res.statusCode < 300) return JSON.parse(text) as T;
      const err = new HttpError(res.statusCode, text);
      // AbortError stops retrying immediately: a 404 will not get better by asking again.
      if (res.statusCode !== 429 && res.statusCode < 500) throw new AbortError(err);
      throw err;
    }, { retries, minTimeout, factor: 2, randomize: false });
  }

  return { getJson, attempts };
}
