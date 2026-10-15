# Pro launch checklist (internal)

Pro is built but OFF. Free tier needs no key and is unchanged. Do not start until the User says go on Stripe.

## What Pro does today
- Key via `Authorization: Bearer <key>` (or `x-provenpin-key`). Checked only when `PROVENPIN_PRO_ENABLED="true"` (exact string).
- Valid key: `PROVENPIN_API_KEYS` secret (comma list), or KV `PRO_KEYS` entry `key:<sha256 hex>`.
  A missing KV entry, a value starting with `revoked`, or a KV error means free (fails closed).
- Pro perk today: `search_recipes` limit cap 25 (free 10). Response header `x-provenpin-tier`.
- Usage events carry tier (blob 7). Pro events also carry a key id (blob 9): first 8 hex chars of the key's SHA-256.
  It cannot be turned back into the key; it lets us count usage per customer. Free events have no key id (unchanged).
  The key, the full hash and the IP are never logged.
- Rate limits: optional `FREE_RL` (60 req/min per IP) and `PRO_RL` (600 req/min per key id) bindings in `wrangler.toml`,
  commented out today, so no limits apply. Over limit: HTTP 429, `retry-after: 60`. Limiter errors fail open.
  The IP is only used as the limiter key at Cloudflare's edge; we never store or log it.

## Go-live steps
1. Get a Cloudflare API token with Workers Scripts Edit + Workers KV Storage Edit. Export as `CLOUDFLARE_API_TOKEN`.
2. `cd server && npx wrangler kv namespace create PRO_KEYS` and copy the id.
3. In `wrangler.toml` uncomment the `[[kv_namespaces]]` block and paste the id.
4. Run `npm test` and `npm run typecheck`.
5. Mint a test key: `node scripts/pro-keys.mjs mint internal-smoke` (key printed once).
6. Optional: uncomment the `[[ratelimits]]` blocks (FREE_RL, PRO_RL). Can ship before Pro; it affects free callers.
   Before doing so, Osborn updates /privacy (see below).
7. Set `PROVENPIN_PRO_ENABLED = "true"` in `wrangler.toml` `[vars]`. Leave `PROVENPIN_REQUIRE_KEY = "false"` (free tier stays open).
8. `npm run deploy`, then smoke test:
   - no key: header `x-provenpin-tier: free`
   - test key: `x-provenpin-tier: pro`
   - `node scripts/pro-keys.mjs revoke <key>`, wait ~60s (KV cache), expect `free`.
9. Commit + push (provenpin-bot author).

## Privacy page (Osborn)
Before Pro or rate limits go live, /privacy should say: the IP address is used briefly to apply rate limits and is not
stored or logged by ProvenPin; for Pro, usage is counted per key using a short non-reversible key id, never the key.

## Stripe (later, separate task)
- Stripe Checkout or Payment Link for Pro.
- Webhook route (e.g. `/stripe/webhook`) verifying the Stripe signature with a `STRIPE_WEBHOOK_SECRET` secret:
  - `checkout.session.completed`: mint key, store hash in KV, deliver key to the customer once (email).
  - `customer.subscription.deleted` / payment failed: write `revoked` to that key's hash.
- Store the Stripe customer id in the KV value so revocation can find the hash.

## Rollback
Set `PROVENPIN_PRO_ENABLED = "false"` and deploy. Everyone becomes free; nothing breaks.
