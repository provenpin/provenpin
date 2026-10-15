import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "./server";

// transformer goes on the link in tRPC 11 (not on createTRPCClient)
export const makeClient = (url: string, fetchImpl?: typeof fetch) =>
  createTRPCClient<AppRouter>({ links: [httpBatchLink({ url, transformer: superjson, fetch: fetchImpl })] });
