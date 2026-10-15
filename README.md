<p align="center"><img src=".github/assets/github-readme-header-dark.png" alt="ProvenPin" width="100%"></p>

# ProvenPin

Tested, version-pinned, multi-library code recipes for AI coding agents, served over MCP.

Every recipe pins exact versions, runs its own tests in a clean environment, and carries a receipt with the time it last passed. Recipes are re-tested automatically when any of their libraries ships a new release. The MCP server only serves recipes that are currently passing.

## MCP tools

| tool | what it does |
|---|---|
| `search_recipes` | find passing recipes by plain words, stack filter or language |
| `get_recipe` | full files, pinned versions, setup and test commands, and the receipt |
| `list_stacks` | libraries that have tested recipes, with counts |

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

## License

MIT. See [LICENSE](LICENSE).
