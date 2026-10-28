# Anonymous usage counter

Purpose: tell real users apart from scanners. The code does nothing unless `PROVENPIN_USAGE_COUNTER = "true"`.
**On in this repo:** `wrangler.toml` sets `PROVENPIN_USAGE_COUNTER = "true"` (since 2026-10-16).
Code: `src/counter.ts`, wired in `src/mcp.ts`. Tests: `test/counter.test.ts`.

## What counts as a "real" call
- `get_recipe` that returns a recipe, or
- `search_recipes` that returns 1 or more results.

Not counted: errors, empty searches, `list_stacks`, `initialize`, `tools/list`, our own internal calls
(`x-provenpin-internal: 1` or client `provenpin-internal`), and requests whose User-Agent matches a known
scanner, crawler or generic HTTP tool (curl, wget, python-requests, Go/Java clients, zgrab, masscan, nmap,
nuclei, censys, shodan, "bot", "spider", "scan", and similar; full list in `SCANNER_UA`). The User-Agent
is only checked in memory, never stored.

## Exactly what is stored
One data point per real call, in Workers Analytics Engine dataset `provenpin_real_usage`:

| field | example | notes |
|---|---|---|
| kind | `real_call` | |
| day | `2026-10-16` | UTC date, no time |
| client name | `claude-code` | from MCP `initialize` clientInfo, lowercased, max 32 chars |
| client version | `1.0` | major.minor only |
| country | `US` | 2-letter code from Cloudflare (`XX` if unknown) |
| tool | `get_recipe` | `get_recipe` or `search_recipes` |

When one session makes its 2nd real call, one more point is written with kind `engaged_session` and the same
day / client / version / country (no tool, no session id). Counting those per day = sessions with 2+ real calls.

To know a session's count, a KV entry is kept: key = `s:<day>:<16 hex chars of SHA-256(secret salt | day | session id)>`,
value = `1` or `2`. It expires automatically after 2 days. The salt includes the day, so the same session cannot be linked across days.
The raw session id is never stored.

**Never stored:** IP addresses, User-Agents, API keys, query text, recipe ids, lockfiles/versions, raw session ids, headers.

## Retention
- Analytics Engine data points: 3 months (Cloudflare's fixed retention), then deleted by Cloudflare.
- Session KV entries: 2 days (auto-expire).

## Cost
Analytics Engine is included on the Workers Free plan (this Worker already uses it for `USAGE`); writes are within
free limits at our volume. KV free tier is 100k reads + 1k writes per day; we write at most 2 times per session per day.
If sessions ever exceed ~500/day the KV writes would start failing (silently ignored), and only the engaged-session number would be undercounted. No paid features are needed.

## Enable
Step 1 and the `USAGE_SESSIONS` block of step 2 are already in this repo's `wrangler.toml`.
1. In `wrangler.toml`: set `PROVENPIN_USAGE_COUNTER = "true"` and uncomment the `USAGE_COUNTER` analytics dataset block.
2. Optional, for engaged sessions: `npx wrangler kv namespace create USAGE_SESSIONS`, paste the id and uncomment the
   `USAGE_SESSIONS` block, then `npx wrangler secret put USAGE_COUNTER_SALT` (any long random string).
3. Deploy. To turn off: set the flag back to `"false"` and deploy.

## Example query (Analytics Engine SQL API)
```sql
SELECT blob2 AS day, blob3 AS client, blob5 AS country, SUM(_sample_interval) AS calls
FROM provenpin_real_usage WHERE blob1 = 'real_call' GROUP BY day, client, country ORDER BY day DESC
```
