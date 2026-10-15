// Cloudflare Workers entry. The index is bundled at build time from ../index/index.json.
import index from "../../index/index.json";
import { createHandler } from "./mcp.ts";
import type { RecipeIndex } from "./search.ts";

interface Env { PROVENPIN_API_KEYS?: string; PROVENPIN_REQUIRE_KEY?: string }
let handler: ((r: Request) => Promise<Response>) | undefined;

export default {
  fetch(req: Request, env: Env): Promise<Response> {
    handler ??= createHandler(index as unknown as RecipeIndex, { apiKeys: env.PROVENPIN_API_KEYS, requireKey: env.PROVENPIN_REQUIRE_KEY });
    return handler(req);
  },
};
