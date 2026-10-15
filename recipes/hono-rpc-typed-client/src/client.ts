import { hc } from "hono/client";
import type { AppType } from "./app.ts";

/** Build an RPC client against any fetch-compatible base (including app.request). */
export function makeClient(baseUrl: string, fetchImpl: typeof fetch) {
  return hc<AppType>(baseUrl, { fetch: fetchImpl });
}
