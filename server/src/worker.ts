// Cloudflare Workers entry. The index is bundled at build time from ../index/index.json.
import index from "../../index/index.json";
import receipts from "../../index/receipts.json";
import { createHandler } from "./mcp.ts";
import type { RecipeIndex } from "./search.ts";

interface Env { PROVENPIN_PRO_ENABLED?: string; PROVENPIN_API_KEYS?: string; PROVENPIN_REQUIRE_KEY?: string; PRO_KEYS?: KVNamespace; USAGE?: AnalyticsEngineDataset; FREE_RL?: RateLimit; PROVENPIN_USAGE_COUNTER?: string; USAGE_COUNTER?: AnalyticsEngineDataset; USAGE_SESSIONS?: KVNamespace; USAGE_COUNTER_SALT?: string; PRO_RL?: RateLimit }
let handler: ((r: Request) => Promise<Response>) | undefined;

export default {
  fetch(req: Request, env: Env): Promise<Response> {
    handler ??= createHandler(index as unknown as RecipeIndex, {
      proEnabled: env.PROVENPIN_PRO_ENABLED, apiKeys: env.PROVENPIN_API_KEYS, keyStore: env.PRO_KEYS,
      requireKey: env.PROVENPIN_REQUIRE_KEY, analytics: env.USAGE, freeLimiter: env.FREE_RL, proLimiter: env.PRO_RL, receipts,
      usageCounter: env.PROVENPIN_USAGE_COUNTER, counterSink: env.USAGE_COUNTER, counterSessions: env.USAGE_SESSIONS, counterSalt: env.USAGE_COUNTER_SALT,
    });
    return handler(req);
  },
};
