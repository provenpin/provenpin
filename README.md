# ProvenPin

Tested, version-pinned, multi-library code recipes for AI coding agents, served over MCP.

```
recipes/   one folder per recipe (see SPEC.md)
runner/    validate, run tests in isolation, write receipts, release check, build index
receipts/  real test receipts (JSON)
index/     built index.json served by the MCP server
server/    MCP server (TypeScript, Cloudflare Workers, local dev mode)
.github/   CI: matrix per recipe, scheduled + on demand, release-triggered re-tests
```

## Run locally (Node 22+, Python 3.13 and uv for Python recipes)

```
npm install
npm run validate                 # check manifests and pins
npm run test:recipes             # run every recipe, write receipts
node runner/run.mjs hono-zod-validator   # run one
npm run affected                 # recipes with newer upstream releases
npm run build:index              # build index/index.json
npm test                         # runner unit tests

cd server && npm install
npm test                         # MCP server unit tests
npm run dev                      # http://localhost:8787/mcp
```

Connect a client to the local server, for example in Claude Code:

```
claude mcp add --transport http provenpin http://localhost:8787/mcp
```

Optional header for the future Pro tier: `x-provenpin-key: <key>` (keys come from the `PROVENPIN_API_KEYS` secret).

## Deploy (not done yet)

1. Push this repo to a GitHub account for the brand.
2. In Cloudflare: create an API token with "Edit Cloudflare Workers", add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repo secrets, set repo variable `DEPLOY_ENABLED=true`.
3. `cd server && npx wrangler deploy` (or let CI do it), then route `mcp.<domain>` to the worker.
