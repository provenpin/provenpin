# ProvenPin recipe format (v1)

A recipe is a folder `recipes/<id>/` holding a `recipe.yaml` manifest plus the files it lists.

## recipe.yaml

| field | type | notes |
|---|---|---|
| `id` | string | kebab-case, must equal the folder name |
| `title` | string | one line, shown to agents |
| `summary` | string | one or two sentences on what it does |
| `language` | `typescript` or `python` | |
| `runtime` | `node` or `python` | picks the dependency manifest that is checked |
| `runtime_version` | string | major runtime used for receipts (node `22`, python `3.13`) |
| `stack` | list | libraries the recipe combines; used by `stack` filters |
| `tags` | list | free-form search terms |
| `pinned` | map | every dependency at an exact version. Must match `package.json` or `requirements.txt` exactly (enforced by `npm run validate`) |
| `files` | list | every file that ships with the recipe, relative paths |
| `setup` | string | shell command run in a clean temp copy (installs pinned deps) |
| `test` | string | shell command; exit 0 plus at least one passing test means passed |
| `test_report` | string, optional | relative path of a JSON (Vitest/Jest `json` reporter) or JUnit XML report the test command writes. When set, counts come from this file and a missing report means failed. Without it, counts are parsed from node:test or pytest output |

Tests must run offline after install: use in-memory SQLite, local mock servers, or request mocks. No real accounts or keys.

## Receipts: receipts/<id>.json

Written by `runner/run.mjs` after a real run. Never edited by hand.

| field | notes |
|---|---|
| `status` | `passed`, `failed`, `setup_failed` or `invalid` |
| `ran_at` | ISO timestamp of this run |
| `last_passed_at` | ISO timestamp of the latest passing run, carried forward on failure |
| `tests` | `{ passed, failed }` parsed from the test output |
| `duration_ms` | `{ setup, test }` |
| `pinned` | versions exactly as tested |
| `recipe_hash` | sha256 over the manifest and files. If files change after the run, the index marks the receipt `stale` |
| `environment` | os, arch, runtime version, runner (`local` or the GitHub Actions run id) |
| `errors`, `log_tail` | validation errors and the last 40 log lines |

The MCP server only serves recipes whose receipt is `passed` and fresh.

## Release check

`runner/affected.mjs` compares each pin with the latest npm or PyPI release and prints only the recipes with a newer upstream version. CI re-tests just those.
