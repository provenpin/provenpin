# ProvenPin MCP server: independent benchmark (Claude), 2026-10-18

Tester: independent-bench-claude. Model: claude-opus-5-5, effort xhigh. Run 2026-10-18T03:50:19Z to 2026-10-18T06:05:16Z. Results folder: provenpin-bench-2026-10-18/. Every number below comes from `score.py` and the CSV/JSONL files; nothing is typed in by hand.

## 1. Verdict for the owner

ProvenPin works as a service: all 819 MCP calls I logged came back HTTP 200 with no rate limiting, typically in about 153 ms. The recipes are what they claim to be: all 194 recipes I downloaded matched their published fingerprints, and all of them passed their own tests when I ran them myself, although 9 first needed a setup fix (8 of them needed a newer npm than the one that ships with Node 22). When a fitting recipe exists, search finds it well: it was the first result for 39 of 45 such tasks and in the top three for 44. The biggest problem is that search never says "I have nothing for this". For all 55 of my tasks with no fitting recipe it still returned ten results, and for 34 of them the first result looked relevant but would lead a developer the wrong way. In the head-to-head test, a coding agent with ProvenPin did not produce working code more often than the same agent without it. Each arm passed all 87 of its runs on the first try. The ProvenPin runs used about 8% more tokens and took a median 76 s against 65 s, but wrote about 11% less code, and they were clearly faster on the two tasks where the recipe pinned APIs the model was unsure about. Coverage is still narrow: only 45 of my 100 everyday tasks had a fitting recipe. I would recommend it today to people who want verified, version-pinned starting points for common Python and TypeScript library pairings, as long as the agent checks that the recipe really fits. I would not use it to answer "is there a known, tested answer for this?".

## 2. Scorecard

One row per metric in the JSON `scores` block. Verification levels: executed = I ran it; fetched = read from the live server or site; reasoned = my judgment from reading.

| metric | value | n | verification |
|---|---|---|---|
| tasks_total | 100 | 100 | executed (designed and searched) |
| coverage_rate | 0.450 | 100 | fetched (index read after search) |
| search_top1_rate | 0.867 | 45 | fetched |
| search_top3_rate | 0.978 | 45 | fetched |
| honest_no_match_rate | 0.000 | 55 | fetched |
| misleading_top1_on_uncovered_rate | 0.618 | 55 | fetched |
| recipe_run_pass_rate | 1.000 | 194 | executed |
| integrity_match_rate | 1.000 | 194 | executed |
| version_check_accuracy | 0.786 | 28 | fetched |
| with_vs_without.with_recipe.first_try_pass_rate | 1.000 | 87 runs | executed |
| with_vs_without.without_recipe.first_try_pass_rate | 1.000 | 87 runs | executed |
| with_vs_without.with_recipe.final_pass_rate | 1.000 | 87 runs | executed |
| with_vs_without.without_recipe.final_pass_rate | 1.000 | 87 runs | executed |
| with_vs_without.with_recipe.mean_attempts | 1 | 87 runs | executed |
| with_vs_without.without_recipe.mean_attempts | 1 | 87 runs | executed |
| with_vs_without.with_recipe.median_seconds | 76.1 | 87 runs | executed |
| with_vs_without.without_recipe.median_seconds | 65.1 | 87 runs | executed |
| with_vs_without.with_recipe.mean_output_tokens | null | 87 runs | executed |
| with_vs_without.without_recipe.mean_output_tokens | null | 87 runs | executed |
| with_vs_without.with_recipe.mean_output_chars | 3206.1 | 87 runs | executed |
| with_vs_without.without_recipe.mean_output_chars | 3617.5 | 87 runs | executed |
| with_vs_without.with_recipe.mean_total_tokens | 74302.9 | 87 runs | executed |
| with_vs_without.without_recipe.mean_total_tokens | 68993.6 | 87 runs | executed |
| with_vs_without.tasks | 29 | 29 | executed |
| latency_ms p50 / p95 / max | 153.0 / 211.0 / 245 | 40 | executed |
| latency_ms errors / rate_limited | 0 / 0 | 40 | executed |
| docs_clarity_1to5 | 3 | 1 page set | fetched |
| safety_flags | 20 | 194 recipes + tool descriptions | reasoned (read) / executed where noted |
| overall_1to10 | 6 | - | reasoned |


Notes on the scorecard:

- `recipe_run_pass_rate` counts a recipe as passing after at most one retry of my setup, as the prompt allows. As published, 185/194 (95%) passed on the first attempt in my environment. Retries: aws-sdk-v3-dynamodb-sqs-vitest (retry_npm116), axios-retry-nock (retry_noproxy), effect-schema-vitest (retry_npm116), hono-drizzle-sqlite-api (retry_npm116), jose-jwks-verify (retry_npm116), jotai-atoms-react-testing-library (retry_npm116), ky-msw-vitest (retry_npm116), redux-toolkit-rtk-query-msw (retry_npm116), trpc-client-server-superjson (retry_npm116). Test counts equal the receipt for 194/194.
- `version_check_accuracy` is judged against expectations I wrote down before the first versions call. Three of the 6 misses (V10, V14, V16) share one cause, test-only pins being left out of the comparison. Without that criterion the score would be 25/28.
- Latency uses the dedicated 40-call sample. Across all 819 logged calls: p50 156.0 ms, p95 401.1 ms, max 633 ms, 0 errors, 0 rate limited. pp.py measures each request inside its lock, so the time spent queueing for the lock is not counted.
- `overall_1to10` = 6: the recipes and integrity are excellent; search is good when a recipe exists but never declines; the agent benefit was not measurable on pass rate; plus the safety and docs issues below.

### Search breakdowns (unfiltered query, top results judged on titles/summaries/stacks only)

| slice | tasks | covered | top1 | top3 | top1 with language filter | top1 with stack filter | honest no-match | misleading top1 (uncovered) | unrelated top1 (uncovered) |
|---|---|---|---|---|---|---|---|---|---|
| all | 100 | 45 | 0.87 (45) | 0.98 (45) | 0.87 (45) | 0.78 (45) | 0.00 (55) | 0.62 (55) | 0.38 (55) |
| python | 50 | 28 | 0.82 (28) | 1.00 (28) | 0.82 (28) | 0.79 (28) | 0.00 (22) | 0.55 (22) | 0.45 (22) |
| typescript | 50 | 17 | 0.94 (17) | 0.94 (17) | 0.94 (17) | 0.76 (17) | 0.00 (33) | 0.67 (33) | 0.33 (33) |
| integration | 40 | 28 | 0.96 (28) | 1.00 (28) | 0.96 (28) | 0.86 (28) | 0.00 (12) | 0.92 (12) | 0.08 (12) |
| version_gotcha | 20 | 11 | 0.64 (11) | 0.91 (11) | 0.64 (11) | 0.64 (11) | 0.00 (9) | 0.44 (9) | 0.56 (9) |
| messy_question | 20 | 6 | 0.83 (6) | 1.00 (6) | 0.83 (6) | 0.67 (6) | 0.00 (14) | 0.71 (14) | 0.29 (14) |
| likely_uncovered | 20 | 0 | - | - | - | - | 0.00 (20) | 0.45 (20) | 0.55 (20) |

Searches that returned count 0: unfiltered 0/100, with language filter 0/100, with stack filter 37/97. Top1 `score` by outcome: covered_fit n=39 min 35.39 median 127.9 max 226.54; uncovered_misleading n=34 min 21.61 median 90.19 max 145.2; covered_not_fit n=6 min 65.02 median 81.05 max 133.32; uncovered_unrelated n=21 min 14.11 median 42.37 max 126.33. The ranges overlap, so the score cannot serve as a relevance cutoff.

### Recipe run breakdowns (194 distinct top-3 recipes, run in isolation)

| slice | recipes | pass on first attempt | pass after setup retry | integrity match | test counts = receipt |
|---|---|---|---|---|---|
| all | 194 | 0.954 (194) | 1.000 (194) | 1.000 (194) | 1.000 (194) |
| python | 95 | 1.000 (95) | 1.000 (95) | 1.000 (95) | 1.000 (95) |
| typescript | 99 | 0.909 (99) | 1.000 (99) | 1.000 (99) | 1.000 (99) |
| top-3 for integration tasks | 106 | 0.934 (106) | 1.000 (106) | 1.000 (106) | 1.000 (106) |
| top-3 for version_gotcha tasks | 59 | 0.949 (59) | 1.000 (59) | 1.000 (59) | 1.000 (59) |
| top-3 for messy_question tasks | 64 | 0.969 (64) | 1.000 (64) | 1.000 (64) | 1.000 (64) |
| top-3 for likely_uncovered tasks | 66 | 0.985 (66) | 1.000 (66) | 1.000 (66) | 1.000 (66) |

Runtime matched the receipt's runtime string for 95/194: all Python ones (3.13.16). Node differed: mine was v22.22.0, the receipts say v22.23.3. Staleness values in receipts.json for these recipes: {'unchecked': 100, 'current': 87, 'passes_on_latest': 6, 'breaks_on_latest': 1}.

### With vs without: per task (3 runs per arm; with / without)

Recipe use reported by the with_recipe agents: used as base 59, read only for an API detail 16, nothing fitting 12 (of 87 runs). With-arm agents made on average 1.84 search calls and 1.06 get calls per run.

| task | lang | category | covered | recipe use (runs 1/2/3) | pass | mean s (diff) | mean total tokens (diff) | mean code chars (diff) |
|---|---|---|---|---|---|---|---|---|
| T001 | py | integration | Y | used/used/used | 3/3 vs 3/3 | 89.5 vs 90.0 (-0.5) | 73907 vs 68777 (+5130) | 5166 vs 5896 (-730) |
| T003 | py | integration | Y | used/used/used | 3/3 vs 3/3 | 46.1 vs 59.2 (-13.1) | 66637 vs 64951 (+1686) | 2006 vs 2314 (-308) |
| T008 | py | integration | Y | used/used/used | 3/3 vs 3/3 | 109.0 vs 100.2 (+8.8) | 73681 vs 69936 (+3745) | 4139 vs 5093 (-954) |
| T009 | py | integration | Y | used/used/used | 3/3 vs 3/3 | 39.3 vs 27.2 (+12.1) | 66927 vs 62045 (+4882) | 3505 vs 3475 (+30) |
| T011 | py | integration | Y | used/used/used | 3/3 vs 3/3 | 47.6 vs 61.3 (-13.7) | 67422 vs 65953 (+1469) | 2345 vs 3207 (-862) |
| T041 | py | version_gotcha | Y | used/used/used | 3/3 vs 3/3 | 75.1 vs 47.7 (+27.4) | 77388 vs 64110 (+13278) | 1957 vs 1949 (+8) |
| T043 | py | version_gotcha | Y | used/used/used | 3/3 vs 3/3 | 192.7 vs 152.4 (+40.3) | 88486 vs 75984 (+12502) | 6860 vs 7544 (-684) |
| T044 | py | version_gotcha | Y | used/used/used | 3/3 vs 3/3 | 48.6 vs 38.3 (+10.3) | 70628 vs 62859 (+7769) | 1274 vs 1487 (-213) |
| T048 | py | version_gotcha | N | none/none/none | 3/3 vs 3/3 | 118.5 vs 104.1 (+14.4) | 77870 vs 70170 (+7700) | 3347 vs 3043 (+304) |
| T065 | py | messy_question | N | reference/reference/reference | 3/3 vs 3/3 | 98.2 vs 87.4 (+10.8) | 75177 vs 68655 (+6522) | 2800 vs 3553 (-753) |
| T067 | py | messy_question | Y | used/used/used | 3/3 vs 3/3 | 98.7 vs 85.6 (+13.1) | 73147 vs 68927 (+4220) | 2984 vs 3502 (-518) |
| T070 | py | messy_question | N | used/used/used | 3/3 vs 3/3 | 92.2 vs 108.3 (-16.1) | 72117 vs 70921 (+1196) | 5617 vs 5929 (-312) |
| T081 | py | likely_uncovered | N | none/none/none | 3/3 vs 3/3 | 74.3 vs 38.1 (+36.2) | 66737 vs 62925 (+3812) | 4536 vs 4383 (+153) |
| T088 | py | likely_uncovered | N | none/none/none | 3/3 vs 3/3 | 52.2 vs 26.3 (+25.9) | 72667 vs 61429 (+11238) | 4107 vs 3796 (+311) |
| T090 | py | likely_uncovered | N | used/used/used | 3/3 vs 3/3 | 114.1 vs 111.4 (+2.7) | 75747 vs 71183 (+4564) | 3441 vs 4499 (-1058) |
| T021 | ty | integration | Y | used/used/used | 3/3 vs 3/3 | 82.2 vs 62.8 (+19.4) | 69802 vs 65846 (+3956) | 3081 vs 3038 (+43) |
| T023 | ty | integration | Y | used/used/used | 3/3 vs 3/3 | 62.0 vs 57.7 (+4.3) | 68933 vs 65051 (+3882) | 2612 vs 2656 (-44) |
| T026 | ty | integration | Y | reference/used/used | 3/3 vs 3/3 | 82.8 vs 61.3 (+21.5) | 76076 vs 65863 (+10213) | 3993 vs 4472 (-479) |
| T030 | ty | integration | Y | used/used/used | 3/3 vs 3/3 | 48.0 vs 46.2 (+1.8) | 70396 vs 64005 (+6391) | 2678 vs 3140 (-462) |
| T033 | ty | integration | N | reference/reference/reference | 3/3 vs 3/3 | 59.5 vs 43.8 (+15.7) | 70308 vs 63448 (+6860) | 1911 vs 1954 (-43) |
| T051 | ty | version_gotcha | Y | reference/reference/reference | 3/3 vs 3/3 | 237.9 vs 244.9 (-7.0) | 95160 vs 87162 (+7998) | 1869 vs 1975 (-106) |
| T052 | ty | version_gotcha | Y | used/used/used | 3/3 vs 3/3 | 71.6 vs 61.4 (+10.2) | 72696 vs 65414 (+7282) | 2404 vs 2491 (-87) |
| T055 | ty | version_gotcha | N | reference/reference/reference | 3/3 vs 3/3 | 47.3 vs 25.9 (+21.4) | 69569 vs 62038 (+7531) | 1497 vs 1566 (-69) |
| T060 | ty | version_gotcha | Y | reference/reference/reference | 3/3 vs 3/3 | 55.1 vs 39.7 (+15.4) | 71253 vs 63306 (+7947) | 2257 vs 2072 (+185) |
| T072 | ty | messy_question | N | used/used/used | 3/3 vs 3/3 | 255.4 vs 368.6 (-113.2) | 92221 vs 97415 (-5194) | 4767 vs 7287 (-2520) |
| T073 | ty | messy_question | Y | used/used/used | 3/3 vs 3/3 | 51.4 vs 63.0 (-11.6) | 66425 vs 65397 (+1028) | 1996 vs 2967 (-971) |
| T079 | ty | messy_question | N | used/used/used | 3/3 vs 3/3 | 85.9 vs 51.5 (+34.4) | 73682 vs 64198 (+9484) | 2584 vs 2684 (-100) |
| T091 | ty | likely_uncovered | N | used/used/used | 3/3 vs 3/3 | 137.2 vs 299.5 (-162.3) | 78340 vs 92285 (-13945) | 3556 vs 5038 (-1482) |
| T098 | ty | likely_uncovered | N | none/none/none | 3/3 vs 3/3 | 140.9 vs 104.5 (+36.4) | 81384 vs 70560 (+10824) | 3689 vs 3894 (-205) |

Wins, losses and ties over the 29 tasks (per-task means; lower is better for attempts, seconds, tokens and chars):

| measure | with_recipe wins | without_recipe wins | tie |
|---|---|---|---|
| pass | 0 | 0 | 29 |
| first_try | 0 | 0 | 29 |
| attempts | 0 | 0 | 29 |
| seconds | 8 | 21 | 0 |
| total_tokens | 2 | 27 | 0 |
| output_chars | 22 | 7 | 0 |

Paired runs (same task and run number, n=87): with minus without, seconds mean +1.6 (median +13.0), total tokens mean +5309.4 (median +6012.0; with used more tokens in 75/87 pairs), code chars mean -411.4 (with wrote less in 60/87 pairs).

By what the with-arm agent did with the recipe (with vs paired without runs): used: median s 74.9 vs 67.7, mean tokens 73697 vs 69618, mean chars 3338 vs 3924; reference: median s 65.8 vs 53.2, mean tokens 76266 vs 68733, mean chars 2183 vs 2365; none: median s 95.5 vs 51.5, mean tokens 74665 vs 66271, mean chars 3920 vs 3779.

By language and category (median seconds and mean tokens, with vs without): python: 79.5 vs 71.5 s, 73236 vs 67255 tokens; typescript: 73.1 vs 58.7 s, 75446 vs 70856 tokens; integration: 61.6 vs 55.2 s, 70409 vs 65588 tokens; version_gotcha: 72.8 vs 56.1 s, 77881 vs 68880 tokens; messy_question: 87.7 vs 79.7 s, 75462 vs 72586 tokens; likely_uncovered: 112.7 vs 69.6 s, 74975 vs 71676 tokens; covered: 69.0 vs 59.4 s, 73468 vs 67387 tokens; uncovered: 90.8 vs 71.1 s, 75485 vs 71269 tokens.

How to read this: my acceptance tests did not separate the arms. Every one of the 174 runs passed on attempt 1, so this sample cannot show a correctness benefit. What it shows is cost: searching and reading a recipe adds tokens and usually time. When nothing fits, that is wasted, e.g. T081, T088, T098 and T055, where the with-arm was 21 to 36 s slower on average. Where the recipe pins APIs the model is unsure about, the with-arm was much faster and wrote less defensive code: T091 (effect 4.0.5) took 137.2 vs 299.5 s, and T072 (axios-retry + bottleneck) took 255.4 vs 368.6 s.

## 3. Per-task table

Recipe run and integrity refer to the task's top unfiltered search result. Notes are my one-line search judgment, made on metadata only. 'with-arm used' is the recipe that most with_recipe runs built on.

| task | lang | libraries | coverage | top result | top1 / top3 | honest no-match | recipe run (top result) | integrity (top result) | with vs without (pass w/wo, mean s w/wo, mean tokens w/wo) | notes |
|---|---|---|---|---|---|---|---|---|---|---|
| T001 | py | fastapi, sqlalchemy, pydantic | covered | fastapi-sqlalchemy-crud | Y / Y | - | pass 2/2 | match | 3/3 vs 3/3; 89.5 vs 90.0; 73907 vs 68777 | with-arm used: fastapi-sqlalchemy-crud. fastapi-sqlalchemy-crud: FastAPI + SQLAlchemy 2 typed models + per-request session dependency, pydantic 2.14.1; #4 async variant also fits; #3 lacks FastAPI |
| T002 | py | fastapi, pyjwt, pwdlib | covered | fastapi-oauth2-pyjwt-scopes | Y / Y | - | pass 5/5 | match | - | fastapi-oauth2-pyjwt-scopes: OAuth2 password login issuing PyJWT tokens with pwdlib hashes; #2 fastapi-jwt-auth also fits |
| T003 | py | httpx, tenacity | covered | httpx-tenacity-retry | Y / Y | - | pass 4/4 | match | 3/3 vs 3/3; 46.1 vs 59.2; 66637 vs 64951 | with-arm used: httpx-tenacity-retry. httpx-tenacity-retry retries 5xx/429/timeouts with backoff and max attempts (adapt: drop 429); #2 async variant also adaptable; #3 is tenacity without httpx |
| T004 | py | celery, redis | uncovered | celery-redis-fakeredis-results | - | no (misleading) | pass 4/4 | match | - | top1 celery-redis-fakeredis-results configures Celery on a Redis broker but is about an idempotency lock; no result mentions autoretry/retry_backoff/self.retry |
| T005 | py | pydantic-settings, pydantic, python-dotenv | covered | pydantic-settings-config | Y / Y | - | pass 3/3 | match | - | pydantic-settings-config: env prefixes, nested settings, .env (pydantic-settings 2.16.0); #2 env_nested_delimiter, #3 YAML+env, #4 dotenv precedence all fit |
| T006 | py | typer, rich | covered | rich-typer-progress-cli | Y / Y | - | pass 6/6 | match | - | rich-typer-progress-cli: Typer + rich Progress + Table tested with CliRunner (single command; adding a second subcommand is trivial). #2/#3 also Typer+Rich t... |
| T007 | py | structlog, fastapi | covered | structlog-fastapi-request-id | Y / Y | - | pass 5/5 | match | - | structlog-fastapi-request-id: ASGI middleware binding a request id into structlog contextvars, JSON output, tested with capture_logs |
| T008 | py | stripe, fastapi | covered | fastapi-stripe-webhook | Y / Y | - | pass 3/3 | match | 3/3 vs 3/3; 109.0 vs 100.2; 73681 vs 69936 | with-arm used: fastapi-stripe-webhook. fastapi-stripe-webhook: raw body signature verification + dispatch on event type, stripe 16.0.0 |
| T009 | py | boto3, moto, pytest | covered | boto3-moto-s3-presigned | Y / Y | - | pass 4/4 | match | 3/3 vs 3/3; 39.3 vs 27.2; 66927 vs 62045 | with-arm used: boto3-moto-s3-presigned. boto3-moto-s3-presigned: boto3 S3 upload/listing/delete helpers tested with moto 5.2.4 |
| T010 | py | pandas, sqlalchemy | covered | pandas-sqlalchemy-to-sql | Y / Y | - | pass 6/6 | match | - | pandas-sqlalchemy-to-sql: read_sql + to_sql through a SQLAlchemy 2 engine on sqlite, pandas 3.0.6 pinned |
| T011 | py | duckdb, polars | covered | duckdb-polars-analytics | Y / Y | - | pass 5/5 | match | 3/3 vs 3/3; 47.6 vs 61.3; 67422 vs 65953 | with-arm used: duckdb-polars-analytics. duckdb-polars-analytics: DuckDB 1.5.6 queries returning .pl() results with a parquet round trip, polars 2.0.0 |
| T012 | py | httpx, respx, pytest | covered | httpx-authlib-oauth2-mock | Y / Y | - | pass 6/6 | match | - | all top results are httpx 0.28.1 + respx 0.23.1 + pytest 9.1.1 recipes with respx-mocked tests |
| T013 | py | sqlalchemy, alembic | covered | sqlalchemy-alembic-migrations | Y / Y | - | pass 2/2 | match | - | sqlalchemy-alembic-migrations: programmatic upgrade/downgrade + autogenerate check with SQLAlchemy 2 models (alembic 1.20.0); #2 autogenerate drift check als... |
| T014 | py | flask, flask-sqlalchemy, marshmallow | covered | marshmallow-sqlalchemy-flask-api | Y / Y | - | pass 5/5 | match | - | marshmallow-sqlalchemy-flask-api: Flask + Flask-SQLAlchemy + marshmallow load/dump with validation errors (422, trivially 400). Note it pins marshmallow 3.26... |
| T015 | py | django, djangorestframework | uncovered | django-drf-api | - | no (misleading) | pass 3/3 | match | - | top1 django-drf-api has ModelViewSet+router+serializer but its summary says token-free permissions; #3 drf-simplejwt is JWT not DRF TokenAuthentication; core... |
| T016 | py | openai, pydantic | covered | openai-python-respx-mock | N / Y | - | pass 3/3 | match | - | #2 openai-structured-output-respx uses chat.completions.parse with a Pydantic response_format (fits); top1 validates JSON output with Pydantic, which may not... |
| T017 | py | anthropic, pydantic | uncovered | anthropic-sdk-mocked-tool-use | - | no (misleading) | pass 2/2 | match | - | top1 is the Anthropic TypeScript SDK tool-use loop (same topic, wrong language) for a Python query; no Python anthropic recipe in s2; stack [anthropic,pydant... |
| T018 | py | httpx, aiolimiter | covered | aiolimiter-httpx-rate-limit | Y / Y | - | pass 6/6 | match | - | aiolimiter-httpx-rate-limit: AsyncLimiter throttling an httpx AsyncClient, exact versions |
| T019 | py | opentelemetry-sdk, opentelemetry-instrumentation-fastapi, fastapi | uncovered | opentelemetry-sdk-inmemory-span | - | no (misleading) | pass 5/5 | match | - | top1 opentelemetry-sdk-inmemory-span sets up the SDK with InMemorySpanExporter but has no FastAPI app or instrumentation; stack filter 0 |
| T020 | py | redis, fastapi | uncovered | requests-cache-sqlite-backend | - | no (unrelated) | pass 4/4 | match | - | top1 requests-cache with sqlite (client-side HTTP cache, different stack); #2 redis pipelines without FastAPI; #4 FastAPI with cashews in-memory, not Redis; ... |
| T021 | ty | express, zod | covered | express-zod-validation | Y / Y | - | pass 3/3 | match | 3/3 vs 3/3; 82.2 vs 62.8; 69802 vs 65846 | with-arm used: express-zod-validation. express-zod-validation: Express 5 + Zod 4 reusable middleware returning 400 with field errors |
| T022 | ty | fastify, @fastify/jwt, jose | covered | fastify-jwt-auth | Y / Y | - | pass 3/3 | match | - | fastify-jwt-auth: Fastify 5 + @fastify/jwt sign/verify with an authenticate preHandler |
| T023 | ty | hono, zod, @hono/zod-validator | covered | hono-rpc-typed-client | Y / Y | - | pass 2/2 | match | 3/3 vs 3/3; 62.0 vs 57.7; 68933 vs 65051 | with-arm used: hono-rpc-typed-client. hono-rpc-typed-client and hono-zod-validator (JSON + query) use @hono/zod-validator 0.9.1 with zod 4.6.7; #3/#4 also use zValidator |
| T024 | ty | drizzle-orm, better-sqlite3, drizzle-kit | uncovered | drizzle-sqlite-crud | - | no (misleading) | pass 1/1 | match | - | top1 drizzle-sqlite-crud is drizzle+better-sqlite3 but explicitly migrations-free; the migrations recipe (#4) is PGlite/Postgres, not better-sqlite3 |
| T025 | ty | prisma, @prisma/client, express | covered | prisma-sqlite-transactions | Y / Y | - | pass 4/4 | match | - | prisma-sqlite-transactions: Prisma 7 CRUD with unique-constraint errors (the library-specific part); wrapping in Express routes is generic glue. stack [prism... |
| T026 | ty | @trpc/server, @trpc/client, zod | covered | trpc-zod-router | Y / Y | - | pass 3/3 | match | 3/3 vs 3/3; 82.8 vs 61.3; 76076 vs 65863 | with-arm used: trpc-context-auth-middleware. trpc-zod-router: tRPC 11 router with zod inputs tested via createCaller (accepted by the definition); #3 adds fetch adapter + createTRPCClient/httpBatchLink.... |
| T027 | ty | bullmq, ioredis | uncovered | p-queue-concurrency | - | no (misleading) | pass 3/3 | match | - | no BullMQ recipe (stack filter 0); top1 p-queue-concurrency is an in-process queue that looks like a job-queue answer but is not Redis-backed BullMQ with ret... |
| T028 | ty | axios, axios-retry | covered | axios-retry-nock | Y / Y | - | pass 4/4 (after setup retry) | match | - | axios-retry-nock: axios 1.20.0 + axios-retry 4.5.0 with exponential backoff on 5xx/429, tested with nock |
| T029 | ty | stripe, express | covered | express-stripe-webhook | Y / Y | - | pass 3/3 | match | - | express-stripe-webhook: Express 5 raw body + constructEvent, stripe 23.0.0 |
| T030 | ty | jose, express | covered | jose-jwks-verify | Y / Y | - | pass 3/3 (after setup retry) | match | 3/3 vs 3/3; 48.0 vs 46.2; 70396 vs 64005 | with-arm used: jose-jwks-verify. jose-jwks-verify: jose 6.2.12 JWKS verification with issuer/audience/expiry checks (library-specific core); Express middleware wiring is generic glue; remote... |
| T031 | ty | vitest, msw | covered | ky-msw-vitest | Y / Y | - | pass 3/3 (after setup retry) | match | - | ky-msw-vitest and RTK Query + MSW + Vitest use msw 3.0.3 setupServer-style mocking with vitest 5.0.4; #3/#4 MSW with fetch-based clients |
| T032 | ty | pino, pino-http, express | covered | express-pino-http-logging | Y / Y | - | pass 2/2 | match | - | express-pino-http-logging: Express 5 + pino-http with request ids and redacted auth headers, exact versions |
| T033 | ty | openai, zod | uncovered | openai-sdk-mocked-tool-calls | - | no (misleading) | pass 2/2 | match | 3/3 vs 3/3; 59.5 vs 43.8; 70308 vs 63448 | with-arm used: none. top1 openai-sdk-mocked-tool-calls is Node SDK + zod but for tool-call arguments, not structured outputs with zodResponseFormat; #2/#3 are Python structured-o... |
| T034 | ty | ai, @ai-sdk/openai, next | uncovered | nextjs-route-handler-zod | - | no (misleading) | pass 3/3 | match | - | top1 is a Next.js 16 route handler with Zod (no AI SDK); #4 vercel-ai-sdk-mock-model-tools covers streamText with a mock model but not a Next.js route return... |
| T035 | ty | @aws-sdk/client-s3, @aws-sdk/s3-request-presigner | covered | aws-sdk-v3-s3-client-mock | Y / Y | - | pass 5/5 | match | - | aws-sdk-v3-s3-client-mock: @aws-sdk/client-s3 + s3-request-presigner 3.1152.0 helpers including locally signed presigned URLs |
| T036 | ty | mongoose, express | uncovered | joi-express-validation | - | no (misleading) | pass 4/4 | match | - | no Mongoose recipe (stack filter 0); top1 joi-express-validation answers schema validation with Joi request validation instead of Mongoose model validators, ... |
| T037 | ty | commander, @inquirer/prompts | uncovered | commander-zod-cli | - | no (misleading) | pass 5/5 | match | - | top1 commander-zod-cli covers commander 15 subcommands but no interactive @inquirer/prompts; stack filter 0 |
| T038 | ty | supertest, express, vitest | covered | express-validator-supertest | Y / Y | - | pass 3/3 | match | - | Express 5.3.0 + supertest 7.3.1 recipes; vitest not in their stacks (likely node:test), switching the runner is trivial |
| T039 | ty | kysely, pg | covered | pg-mem-kysely-postgres-tests | Y / Y | - | pass 6/6 | match | - | top1 pg-mem-kysely runs Kysely through a node-postgres-compatible adapter with typed queries (swap to a real pg Pool); transaction not explicit in summary (v... |
| T040 | ty | p-retry, p-limit | uncovered | undici-mockagent-p-retry | - | no (misleading) | pass 5/5 | match | - | top1 undici-mockagent-p-retry shows p-retry 8.0.1 with AbortError but no concurrency cap; #4 p-limit-concurrency shows p-limit alone; no recipe combines them... |
| T041 | py | pydantic | covered | sqlalchemy2-pydantic-v2-from-attributes | Y / Y | - | pass 4/4 | match | 3/3 vs 3/3; 75.1 vs 47.7; 77388 vs 64110 | with-arm used: fastapi-pydantic-v2-models. #1 Pydantic v2 from_attributes on ORM rows and #2 field_validator/model_validator patterns (both 2.14.1) cover the v2 idioms; neither is framed as a v1->v2 m... |
| T042 | py | sqlalchemy | covered | sqlmodel-sqlalchemy-core-select | N / Y | - | pass 6/6 | match | - | code: sqlalchemy-hybrid-events uses DeclarativeBase/Mapped/mapped_column with select()+session.scalars(); rank-4 factory-boy recipe not fetched, so not count... |
| T043 | py | httpx, fastapi | covered | fastapi-httpx-asyncclient-lifespan | Y / Y | - | pass 6/6 | match | 3/3 vs 3/3; 192.7 vs 152.4; 88486 vs 75984 | with-arm used: fastapi-httpx-asyncclient-lifespan. fastapi-httpx-asyncclient-lifespan, fastapi-dependency-overrides-httpx and the async SQLAlchemy recipe all drive FastAPI through httpx 0.28.1 ASGITransport |
| T044 | py | fastapi | covered | fastapi-httpx-asyncclient-lifespan | Y / Y | - | pass 6/6 | match | 3/3 vs 3/3; 48.6 vs 38.3; 70628 vs 62859 | with-arm used: fastapi-httpx-asyncclient-lifespan. fastapi-httpx-asyncclient-lifespan opens a resource in a FastAPI lifespan handler; directly shows the lifespan pattern |
| T045 | py | pyjwt | covered | returns-maybe-ioresult | N / Y | - | pass 6/6 | match | - | top1 is the returns library (Maybe/IOResult): the word returns in the query matched a library name. #2-#4 are PyJWT 2.15.1 recipes with explicit algorithms (... |
| T046 | py | openai | covered | openai-python-respx-mock | Y / Y | - | pass 3/3 | match | - | openai-python-respx-mock and openai-structured-output-respx use the openai 3.31.0 OpenAI() client, which shows the post-0.28 API; #2/#3 in s1 are TypeScript |
| T047 | py | pytest-asyncio, pytest | covered | pytest-asyncio-taskgroup-timeouts | Y / Y | - | pass 5/5 | match | - | recipes pinned to pytest-asyncio 1.4.0 with async tests and fixtures (TaskGroup timeouts, async SQLAlchemy, anyio); should show 1.x configuration without eve... |
| T048 | py | pandas | uncovered | pandas-sqlalchemy-to-sql | - | no (unrelated) | pass 6/6 | match | 3/3 vs 3/3; 118.5 vs 104.1; 77870 vs 70170 | with-arm used: none. results are pandas 3.0.6 recipes on other topics (SQL, Excel, pandera, sklearn); none covers copy-on-write or the str dtype |
| T049 | py | marshmallow | covered | marshmallow-dataclass-schema | N / Y | - | pass 6/6 | match | - | code: flask-marshmallow-webargs (rank 2) uses fields.*(load_default=...) on marshmallow 4.3.1 and no Schema.context; top1 marshmallow-dataclass-schema shows ... |
| T050 | py | numpy | uncovered | numpy-scipy-optimize-fit | - | no (misleading) | pass 6/6 | match | - | top1 numpy-scipy-optimize-fit pins numpy 2.5.4 but is a curve-fitting recipe; nothing about the removed np.float_/np.NaN/np.Inf aliases |
| T051 | ty | zod | covered | zod-v4-json-schema-export | N / N | - | pass 4/4 | match | 3/3 vs 3/3; 237.9 vs 244.9; 95160 vs 87162 | with-arm used: none. code: nestjs-zod-validation-pipe (rank 5) and express-zod-validation (not in top 10) use z.email() and z.flattenError (2 of the 3 named zod 4 changes); no zo... |
| T052 | ty | express | covered | express5-async-error-handling | Y / Y | - | pass 3/3 | match | 3/3 vs 3/3; 71.6 vs 61.4; 72696 vs 65414 | with-arm used: express5-async-error-handling. express5-async-error-handling shows Express 5 forwarding rejected async handlers to error middleware (the definition accepts either gotcha); nothing about na... |
| T053 | ty | eslint, typescript-eslint | uncovered | json-schema-to-typescript-codegen | - | no (unrelated) | pass 4/4 | match | - | top1 json-schema-to-typescript codegen; #2 is a Python Flask-Migrate recipe for a TypeScript ESLint query; nothing about ESLint flat config; stack filter ret... |
| T054 | ty | next | uncovered | nextjs-stripe-webhook | - | no (unrelated) | pass 3/3 | match | - | results are Next.js 16.4.1 recipes on other topics (Stripe webhook, Zod route handler, Supabase middleware, server actions); none is about await params/cooki... |
| T055 | ty | fastify | uncovered | fastify-swagger-openapi | - | no (misleading) | pass 3/3 | match | 3/3 vs 3/3; 47.3 vs 25.9; 69569 vs 62038 | with-arm used: none. results are Fastify 5.12.7 recipes (swagger, JSON schema validation, zod provider, jwt); #2 shows full JSON Schema validation but none covers the v4->v5 redi... |
| T056 | ty | typeorm | uncovered | nestjs-typeorm-sqlite | - | no (misleading) | pass 2/2 | match | - | top1 nestjs-typeorm-sqlite pins typeorm 1.1.2 but goes through @nestjs/typeorm, not new DataSource().initialize()/getRepository directly |
| T057 | ty | tailwindcss, @tailwindcss/postcss | uncovered | postcss-custom-plugin-autoprefixer | - | no (unrelated) | pass 4/4 | match | - | no Tailwind recipe (stack filter 0); top1 is a custom PostCSS plugin + autoprefixer; #2 clsx/tailwind-merge class helpers |
| T058 | ty | react, react-dom | uncovered | jotai-atoms-react-testing-library | - | no (unrelated) | pass 5/5 (after setup retry) | match | - | results are React 19.3.1-pinned recipes on other topics (jotai, react-hook-form, react-email, i18next, mdx); none covers createRoot, ref as prop or useAction... |
| T059 | ty | drizzle-kit, drizzle-orm | uncovered | drizzle-sqlite-crud | - | no (misleading) | pass 1/1 | match | - | no drizzle-kit config recipe (stack filter 0); top1 drizzle-sqlite-crud is migrations-free |
| T060 | ty | openai | covered | openai-streaming-mock | Y / Y | - | pass 2/2 | match | 3/3 vs 3/3; 55.1 vs 39.7; 71253 vs 63306 | with-arm used: none. openai-streaming-mock and openai-sdk-mocked-tool-calls use the current Node SDK (pinned 7.34.0) with chat completions; enough to show the new client shape |
| T061 | py | fastapi, pydantic, sqlalchemy | covered | fastapi-sqlalchemy-crud | Y / Y | - | pass 2/2 | match | - | top1 fastapi-sqlalchemy-crud (FastAPI + SQLAlchemy 2 + pydantic 2.14.1 pinned) should serialize ORM rows via from_attributes; summary does not say so explici... |
| T062 | py | celery, redis | uncovered | celery-redis-fakeredis-results | - | no (misleading) | pass 4/4 | match | - | top1 celery-redis-fakeredis-results configures Celery on Redis but shows an idempotency lock, not retries/backoff or time limits/visibility settings for hang... |
| T063 | py | sqlalchemy, fastapi | covered | fastapi-async-sqlalchemy-aiosqlite-pytest | Y / Y | - | pass 4/4 | match | - | FastAPI + SQLAlchemy 2 recipes with a per-request session dependency; whether they set expire_on_commit=False or refresh after commit is not in the summary (... |
| T064 | py | pytest, pytest-asyncio | covered | fastapi-async-sqlalchemy-aiosqlite-pytest | Y / Y | - | pass 4/4 | match | - | recipes pinned to pytest-asyncio 1.4.0 with async tests/fixtures (FastAPI async SQLAlchemy, aiofiles+anyio, async SQLAlchemy fixtures) should show a working ... |
| T065 | py | pandas, polars | uncovered | pandas-openpyxl-excel-report | - | no (unrelated) | pass 4/4 | match | 3/3 vs 3/3; 98.2 vs 87.4; 75177 vs 68655 | with-arm used: none. top1 is a pandas-to-Excel report; no result covers SettingWithCopy / copy-on-write assignment or pandas-vs-polars; stack [pandas,polars] returns 0 |
| T066 | py | boto3 | uncovered | csv-parse-stringify-streams | - | no (misleading) | pass 3/3 | match | - | s1 top1 is TypeScript csv-parse streaming (same memory concern, wrong language, no S3); s2 boto3-moto-s3-presigned does uploads/listing/presign but no multip... |
| T067 | py | pyyaml, pydantic-settings, pydantic | covered | pydantic-settings-config | N / Y | - | pass 3/3 | match | 3/3 vs 3/3; 98.7 vs 85.6; 73147 vs 68927 | with-arm used: pydantic-settings-yaml-secrets. #2 pydantic-settings-yaml-secrets loads YAML+env with env above YAML (fits); top1 pydantic-settings-config covers env/.env but no YAML |
| T068 | py | structlog, fastapi, uvicorn | uncovered | structlog-fastapi-request-id | - | no (misleading) | pass 5/5 | match | - | top1 structlog-fastapi-request-id covers JSON logs with a request id but nothing about routing uvicorn access logs through the same formatter |
| T069 | py | httpx, fastapi, pytest | covered | fastapi-httpx-asyncclient-lifespan | Y / Y | - | pass 6/6 | match | - | fastapi-httpx-asyncclient-lifespan, the async SQLAlchemy recipe and dependency-overrides recipe drive FastAPI through httpx 0.28.1 ASGITransport, the fix for... |
| T070 | py | fastapi, pyjwt | uncovered | fastapi-jwt-auth | - | no (misleading) | pass 2/2 | match | 3/3 vs 3/3; 92.2 vs 108.3; 72117 vs 70921 | with-arm used: fastapi-jwt-auth. top1 fastapi-jwt-auth is FastAPI+PyJWT bearer auth but its summary has no refresh tokens or expired-token 401 handling; the only refresh-token recipe shown i... |
| T071 | ty | jsonwebtoken, express | uncovered | flask-jwt-extended-auth | - | no (misleading) | pass 3/3 | match | - | s1 top1 is a Python Flask-JWT-Extended refresh-token recipe (same topic, wrong language) for a Node query; Express+jsonwebtoken recipes exist (passport-jwt, ... |
| T072 | ty | axios, axios-retry, bottleneck | uncovered | axios-retry-nock | - | no (misleading) | pass 4/4 (after setup retry) | match | 3/3 vs 3/3; 255.4 vs 368.6; 92221 vs 97415 | with-arm used: axios-retry-nock. top1 axios-retry-nock covers axios-retry backoff (429/5xx, easy to narrow to 503) but no request-rate limiter; no bottleneck+axios recipe in results |
| T073 | ty | stripe, express | covered | express-stripe-webhook | Y / Y | - | pass 3/3 | match | 3/3 vs 3/3; 51.4 vs 63.0; 66425 vs 65397 | with-arm used: express-stripe-webhook. express-stripe-webhook: Express 5 raw-body verification with constructEvent, the fix for the signature error |
| T074 | ty | zod | uncovered | zod-v4-json-schema-export | - | no (unrelated) | pass 4/4 | match | - | results are zod 4.6.7 recipes on other topics (JSON Schema export, ws protocol, NestJS pipe, OpenAPI); none shows the v4 error param or customError |
| T075 | ty | express | uncovered | express5-async-error-handling | - | no (misleading) | pass 3/3 | match | - | top1 express5-async-error-handling is Express 5.3.0 but about async errors; nothing shows v5 path syntax (named wildcards) that fixes the path-to-regexp crash |
| T076 | ty | prisma, @prisma/client, next | uncovered | prisma-sqlite-adapter | - | no (misleading) | pass 1/1 | match | - | top1 prisma-sqlite-adapter is Prisma 7 with a SQLite driver adapter; nothing on a client singleton or serverless Postgres pooling (connection_limit, pgbounce... |
| T077 | ty | jest, ts-jest, typescript | uncovered | rollup-virtual-module-bundle | - | no (unrelated) | pass 3/3 | match | - | no Jest/ts-jest recipe; top1 rollup virtual modules |
| T078 | ty | drizzle-orm, drizzle-kit, better-sqlite3 | uncovered | drizzle-sqlite-crud | - | no (misleading) | pass 1/1 | match | - | top1 drizzle-sqlite-crud is drizzle+better-sqlite3 but explicitly migrations-free table creation; nothing shows drizzle-kit generate or migrate(); stack filt... |
| T079 | ty | openai, express | uncovered | openai-streaming-mock | - | no (misleading) | pass 2/2 | match | 3/3 vs 3/3; 85.9 vs 51.5; 73682 vs 64198 | with-arm used: openai-streaming-mock. top1 openai-streaming-mock covers Node SDK streaming and aborts but not Express or SSE output; stack [openai,express] returns 0 |
| T080 | ty | next | uncovered | nextjs-stripe-webhook | - | no (unrelated) | pass 3/3 | match | - | top1 is the Next.js Stripe webhook route; #3 Supabase middleware refreshes cookies in middleware but nothing shows await cookies() in a server component or r... |
| T081 | py | ortools | uncovered | mcp-sdk-inmemory-tools | - | no (unrelated) | pass 4/4 | match | 3/3 vs 3/3; 74.3 vs 38.1; 66737 vs 62925 | with-arm used: none. no OR-Tools recipe; top1 is a TypeScript MCP SDK recipe for a Python sudoku query; language-filtered results are unrelated Python libs; stack filter 0 |
| T082 | py | textual | uncovered | cryptography-fernet-multi-key | - | no (unrelated) | pass 6/6 | match | - | no Textual recipe (stack filter 0); top1 cryptography MultiFernet |
| T083 | py | xarray, cfgrib | uncovered | tar-pack-extract | - | no (unrelated) | pass 2/2 | match | - | no xarray/cfgrib recipe; top1 node-tar (TypeScript) |
| T084 | py | hl7apy | uncovered | fastapi-pydantic-v2-models | - | no (unrelated) | pass 4/4 | match | - | no hl7apy recipe (stack filter 0); top1 FastAPI Pydantic patterns |
| T085 | py | weasyprint, jinja2 | uncovered | jinja2-markupsafe-email-templates | - | no (misleading) | pass 6/6 | match | - | no WeasyPrint recipe (stack filter 0); top1 Jinja2 email templates covers only the templating half; #4 is TypeScript pdf-lib |
| T086 | py | psycopg | uncovered | drizzle-pglite-migrations | - | no (unrelated) | pass 3/3 | match | - | no psycopg recipe (stack filter 0); s1 top results are TypeScript Drizzle/PGlite; s2 top1 is a generic boltons retry decorator (the trap the definition exclu... |
| T087 | py | app-store-server-library, cryptography, pyjwt | uncovered | fastapi-pydantic-v2-models | - | no (unrelated) | pass 4/4 | match | - | nothing about Apple JWS/x5c; top1 is a FastAPI Pydantic recipe, #2 node-forge self-signed cert (TS) |
| T088 | py | python-stdlib | uncovered | lru-cache-ttl | - | no (misleading) | pass 3/3 | match | 3/3 vs 3/3; 52.2 vs 26.3; 72667 vs 61429 | with-arm used: none. trap task: top1 is the TypeScript lru-cache library; s2 top1 is diskcache+cachetools; both are library-based caches that the task excludes |
| T089 | py | gpiozero | uncovered | web-push-vapid-payload-encryption | - | no (unrelated) | pass 5/5 | match | - | no gpiozero recipe; top1 is a TypeScript web-push recipe |
| T090 | py | litestar, msgspec | uncovered | litestar-guards-di | - | no (misleading) | pass 5/5 | match | 3/3 vs 3/3; 114.1 vs 111.4; 75747 vs 71183 | with-arm used: litestar-guards-di. code: litestar-guards-di has Provide-based DI but no request bodies and no msgspec Structs at all; no Litestar+msgspec recipe in the index |
| T091 | ty | effect | uncovered | effect-schema-vitest | - | no (misleading) | pass 5/5 (after setup retry) | match | 3/3 vs 3/3; 137.2 vs 299.5; 78340 vs 92285 | with-arm used: effect-schema-vitest. top1 effect-schema-vitest (effect 4.0.5) covers Schema decoding and TaggedError but its summary has no service tag or Layer, a core part of the task |
| T092 | ty | bun | uncovered | ws-zod-message-protocol | - | no (misleading) | pass 4/4 | match | - | no Bun recipe; top1 ws-zod-message-protocol is a Node ws room-chat server: same topic (websocket rooms) but not Bun.serve pub/sub |
| T093 | ty | deno | uncovered | p-map-concurrency-limit | - | no (unrelated) | pass 1/1 | match | - | nothing about Deno or Deno KV; results are p-map/p-queue/bottleneck concurrency helpers |
| T094 | ty | cloudflare-workers, wrangler | uncovered | rate-limiter-flexible-memory | - | no (misleading) | pass 8/8 | match | - | no Cloudflare Workers/Durable Object recipe; top1 rate-limiter-flexible in-memory matches the rate-limit topic but cannot work as a Durable Object |
| T095 | ty | @temporalio/workflow, @temporalio/client, @temporalio/worker | uncovered | temporal-polyfill-dates | - | no (misleading) | pass 2/2 | match | - | name collision: top1 is the JS Temporal date polyfill, not the Temporal workflow SDK; no @temporalio recipe (stack filter 0) |
| T096 | ty | electron | uncovered | nanoid-custom-alphabet | - | no (unrelated) | pass 3/3 | match | - | no Electron recipe; top1 nanoid |
| T097 | ty | three | uncovered | vue-server-renderer-ssr | - | no (unrelated) | pass 3/3 | match | - | no three.js recipe; top1 Vue SSR |
| T098 | ty | ts-json-schema-generator | uncovered | json-schema-to-typescript-codegen | - | no (misleading) | pass 4/4 | match | 3/3 vs 3/3; 140.9 vs 104.5; 81384 vs 70560 | with-arm used: none. top1 json-schema-to-typescript goes the opposite direction (JSON Schema -> TS types); #2 is zod z.toJSONSchema which the task excludes; no ts-json-schema-gen... |
| T099 | ty | @stripe/stripe-terminal-react-native | uncovered | fastapi-stripe-webhook | - | no (misleading) | pass 3/3 | match | - | trap task: top results are Stripe webhook recipes (FastAPI, Express, Next.js), which look relevant by name but do nothing for Terminal reader discovery/colle... |
| T100 | ty | typescript | uncovered | json-schema-to-typescript-codegen | - | no (unrelated) | pass 4/4 | match | - | non-glue TypeScript language question; top1 json-schema-to-typescript codegen |


## 4. Failures

Each entry gives the exact tool and arguments, an excerpt of the response, what I expected and what I observed. The 'observed' text for search failures is my judgment recorded at search time (metadata only). Version checks in full: `csv/version_checks.csv` and the table after this list.

1. **F01 [minor, search_miss]** task T016
   - tool: `search_recipes`; arguments: `{"query": "OpenAI Python SDK structured outputs parsed into a Pydantic model"}`
   - response: #1 openai-python-respx-mock (python, score 133.32): OpenAI Python SDK structured outputs, tested with respx | #2 openai-structured-output-respx (python, score 120.15): OpenAI chat.completions.parse with Pydantic output + respx mocks | #3 openai-sdk-mocked-tool-calls (typescript, score 78.63): OpenAI Node SDK tool calling + Zod, tested with a mocked fetch
   - expected: a fitting recipe at rank 1: openai-structured-output-respx
   - observed / why it matters: top1 is not fitting (a fitting recipe is in the top 3): #2 openai-structured-output-respx uses chat.completions.parse with a Pydantic response_format (fits); top1 validates JSON output with Pydantic, which may not use the parse helper (verify)
2. **F02 [minor, search_miss]** task T042
   - tool: `search_recipes`; arguments: `{"query": "SQLAlchemy 1.4 to 2.0: replace session.query() with select() and use Mapped[] typed models"}`
   - response: #1 sqlmodel-sqlalchemy-core-select (python, score 65.02): SQLModel tables queried with SQLAlchemy Core select on sqlite | #2 sqlalchemy-hybrid-events (python, score 64.4): SQLAlchemy 2.0 hybrid properties, column_property and before_flush audit events | #3 flask-migrate-sqlite (python, score 55.42): Flask-SQLAlchemy models with Flask-Migrate upgrades on sqlite in tests
   - expected: a fitting recipe at rank 1: sqlalchemy-hybrid-events
   - observed / why it matters: top1 is not fitting (a fitting recipe is in the top 3): code: sqlalchemy-hybrid-events uses DeclarativeBase/Mapped/mapped_column with select()+session.scalars(); rank-4 factory-boy recipe not fetched, so not counted; top1 is SQLModel + Core select
3. **F03 [minor, search_miss]** task T045
   - tool: `search_recipes`; arguments: `{"query": "PyJWT 2 upgrade: jwt.decode now requires algorithms and jwt.encode returns str instead of bytes"}`
   - response: #1 returns-maybe-ioresult (python, score 68.43): returns Maybe and IOResult railway composition with map and bind | #2 fastapi-oauth2-pyjwt-scopes (python, score 66.35): FastAPI OAuth2 password flow with PyJWT tokens and scope checks | #3 pyjwt-cryptography-rs256 (python, score 66.35): RS256 JWTs with PyJWT and cryptography-generated keys
   - expected: a fitting recipe at rank 1: fastapi-jwt-auth, fastapi-oauth2-pyjwt-scopes, pyjwt-cryptography-rs256
   - observed / why it matters: top1 is not fitting (a fitting recipe is in the top 3): top1 is the returns library (Maybe/IOResult): the word returns in the query matched a library name. #2-#4 are PyJWT 2.15.1 recipes with explicit algorithms (pyjwt-cryptography-rs256 enforces algorithm)
4. **F04 [minor, search_miss]** task T049
   - tool: `search_recipes`; arguments: `{"query": "marshmallow 4 upgrade: missing= and default= removed, use load_default and dump_default, and Schema.context removed"}`
   - response: #1 marshmallow-dataclass-schema (python, score 87.81): marshmallow-dataclass schemas: nested load, dump and validation | #2 flask-marshmallow-webargs (python, score 63.47): Flask API args parsed and validated with webargs and marshmallow | #3 marshmallow-sqlalchemy-flask-api (python, score 58.75): Flask API with Flask-SQLAlchemy and marshmallow-sqlalchemy, validation errors as 422
   - expected: a fitting recipe at rank 1: flask-marshmallow-webargs
   - observed / why it matters: top1 is not fitting (a fitting recipe is in the top 3): code: flask-marshmallow-webargs (rank 2) uses fields.*(load_default=...) on marshmallow 4.3.1 and no Schema.context; top1 marshmallow-dataclass-schema shows neither
5. **F05 [major, search_miss]** task T051
   - tool: `search_recipes`; arguments: `{"query": "zod v3 to v4 migration: z.string().email() deprecated, message param renamed to error, error.flatten() and format() replaced, z.record needs a key schema"}`
   - response: #1 zod-v4-json-schema-export (typescript, score 80.99): Zod v4 schemas exported to JSON Schema and checked with Ajv | #2 ws-zod-message-protocol (typescript, score 51.5): ws WebSocket server with a Zod-validated message protocol | #3 zod-to-openapi-document-generation (typescript, score 51.24): Zod 4 schemas to an OpenAPI 3.1 document with zod-to-openapi
   - expected: a fitting recipe in the top 3: nestjs-zod-validation-pipe, express-zod-validation
   - observed / why it matters: code: nestjs-zod-validation-pipe (rank 5) and express-zod-validation (not in top 10) use z.email() and z.flattenError (2 of the 3 named zod 4 changes); no zod recipe uses the error param; top1 zod-v4-json-schema-export has only z.email()
6. **F06 [minor, search_miss]** task T067
   - tool: `search_recipes`; arguments: `{"query": "how parse yaml config file + validate with pydantic and let env vars override values??"}`
   - response: #1 pydantic-settings-config (python, score 81.11): Pydantic Settings typed config from env and .env | #2 pydantic-settings-yaml-secrets (python, score 73.55): pydantic-settings v2 config from env, YAML and defaults with SecretStr | #3 js-yaml-zod-config (typescript, score 66.21): js-yaml 5 config files validated with Zod 4
   - expected: a fitting recipe at rank 1: pydantic-settings-yaml-secrets
   - observed / why it matters: top1 is not fitting (a fitting recipe is in the top 3): #2 pydantic-settings-yaml-secrets loads YAML+env with env above YAML (fits); top1 pydantic-settings-config covers env/.env but no YAML
7. **F07 [major, false_match]** task T004
   - tool: `search_recipes`; arguments: `{"query": "Celery task with automatic retries and exponential backoff using Redis broker"}`
   - response: count 10; #1 celery-redis-fakeredis-results (python, score 138.68): Celery 5 on Redis with fakeredis-backed idempotency, tested offline in eager mode
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 celery-redis-fakeredis-results configures Celery on a Redis broker but is about an idempotency lock; no result mentions autoretry/retry_backoff/self.retry
8. **F08 [major, false_match]** task T015
   - tool: `search_recipes`; arguments: `{"query": "Django REST Framework ModelViewSet with token authentication"}`
   - response: count 10; #1 django-drf-api (python, score 98.93): Django 6 + Django REST Framework model API with pytest-django
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 django-drf-api has ModelViewSet+router+serializer but its summary says token-free permissions; #3 drf-simplejwt is JWT not DRF TokenAuthentication; core token-auth requirement missing
9. **F09 [major, false_match]** task T017
   - tool: `search_recipes`; arguments: `{"query": "Anthropic Python SDK tool use loop with tool input schema from a Pydantic model"}`
   - response: count 10; #1 anthropic-sdk-mocked-tool-use (typescript, score 100.25): Anthropic TypeScript SDK tool use loop, tested with a mocked fetch
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 is the Anthropic TypeScript SDK tool-use loop (same topic, wrong language) for a Python query; no Python anthropic recipe in s2; stack [anthropic,pydantic] returns 0
10. **F10 [major, false_match]** task T019
   - tool: `search_recipes`; arguments: `{"query": "OpenTelemetry tracing for FastAPI with console or in-memory span exporter"}`
   - response: count 10; #1 opentelemetry-sdk-inmemory-span (python, score 114.74): OpenTelemetry SDK spans captured with InMemorySpanExporter
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 opentelemetry-sdk-inmemory-span sets up the SDK with InMemorySpanExporter but has no FastAPI app or instrumentation; stack filter 0
11. **F11 [major, false_match]** task T024
   - tool: `search_recipes`; arguments: `{"query": "Drizzle ORM with better-sqlite3 schema, migrations and relational queries"}`
   - response: count 10; #1 drizzle-sqlite-crud (typescript, score 145.2): Drizzle ORM + better-sqlite3 CRUD
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 drizzle-sqlite-crud is drizzle+better-sqlite3 but explicitly migrations-free; the migrations recipe (#4) is PGlite/Postgres, not better-sqlite3
12. **F12 [major, false_match]** task T027
   - tool: `search_recipes`; arguments: `{"query": "BullMQ queue and worker with retries and exponential backoff"}`
   - response: count 10; #1 p-queue-concurrency (typescript, score 35.46): p-queue bounded concurrency
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: no BullMQ recipe (stack filter 0); top1 p-queue-concurrency is an in-process queue that looks like a job-queue answer but is not Redis-backed BullMQ with retries
13. **F13 [major, false_match]** task T033
   - tool: `search_recipes`; arguments: `{"query": "OpenAI Node SDK structured outputs with a zod schema"}`
   - response: count 10; #1 openai-sdk-mocked-tool-calls (typescript, score 119.36): OpenAI Node SDK tool calling + Zod, tested with a mocked fetch
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 openai-sdk-mocked-tool-calls is Node SDK + zod but for tool-call arguments, not structured outputs with zodResponseFormat; #2/#3 are Python structured-output recipes; s2 adds zod JSON Schema export and the Vercel AI SDK
14. **F14 [major, false_match]** task T034
   - tool: `search_recipes`; arguments: `{"query": "stream LLM chat responses from a Next.js route handler using the Vercel AI SDK"}`
   - response: count 10; #1 nextjs-route-handler-zod (typescript, score 94.2): Next.js 16 App Router route handler + Zod validation
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 is a Next.js 16 route handler with Zod (no AI SDK); #4 vercel-ai-sdk-mock-model-tools covers streamText with a mock model but not a Next.js route returning the stream; stack [ai,@ai-sdk/openai] returns 0
15. **F15 [major, false_match]** task T036
   - tool: `search_recipes`; arguments: `{"query": "Express and Mongoose REST API with schema validation and pagination"}`
   - response: count 10; #1 joi-express-validation (typescript, score 74.24): Joi request validation middleware for Express 5
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: no Mongoose recipe (stack filter 0); top1 joi-express-validation answers schema validation with Joi request validation instead of Mongoose model validators, with no persistence or pagination
16. **F16 [major, false_match]** task T037
   - tool: `search_recipes`; arguments: `{"query": "Node CLI with commander subcommands and interactive prompts using @inquirer/prompts"}`
   - response: count 10; #1 commander-zod-cli (typescript, score 99.81): Commander CLI with Zod option validation, tested in-process
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 commander-zod-cli covers commander 15 subcommands but no interactive @inquirer/prompts; stack filter 0
17. **F17 [major, false_match]** task T040
   - tool: `search_recipes`; arguments: `{"query": "fetch 100 API items with max 5 concurrent requests and retry failures with p-retry"}`
   - response: count 10; #1 undici-mockagent-p-retry (typescript, score 86.17): undici HTTP client with p-retry backoff, tested with MockAgent
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 undici-mockagent-p-retry shows p-retry 8.0.1 with AbortError but no concurrency cap; #4 p-limit-concurrency shows p-limit alone; no recipe combines them (stack filter 0)
18. **F18 [major, false_match]** task T050
   - tool: `search_recipes`; arguments: `{"query": "NumPy 2.0 removed np.float_, np.NaN and np.Inf: fix AttributeError after upgrading"}`
   - response: count 10; #1 numpy-scipy-optimize-fit (python, score 69.8): NumPy + SciPy curve_fit and bounded minimize, tested with seeded noise
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 numpy-scipy-optimize-fit pins numpy 2.5.4 but is a curve-fitting recipe; nothing about the removed np.float_/np.NaN/np.Inf aliases
19. **F19 [major, false_match]** task T055
   - tool: `search_recipes`; arguments: `{"query": "Fastify v4 to v5 migration: full JSON schema required for querystring and params, reply.redirect argument order changed, listen needs an options object"}`
   - response: count 10; #1 fastify-swagger-openapi (typescript, score 75.87): Fastify 5 OpenAPI docs generated with @fastify/swagger
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: results are Fastify 5.12.7 recipes (swagger, JSON schema validation, zod provider, jwt); #2 shows full JSON Schema validation but none covers the v4->v5 redirect argument order or listen options
20. **F20 [major, false_match]** task T056
   - tool: `search_recipes`; arguments: `{"query": "TypeORM createConnection and getRepository removed: migrate to DataSource"}`
   - response: count 10; #1 nestjs-typeorm-sqlite (typescript, score 75.71): NestJS 12 + TypeORM 1 on in-memory SQLite, tested with @nestjs/testing
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 nestjs-typeorm-sqlite pins typeorm 1.1.2 but goes through @nestjs/typeorm, not new DataSource().initialize()/getRepository directly
21. **F21 [major, false_match]** task T059
   - tool: `search_recipes`; arguments: `{"query": "drizzle-kit config changed: driver replaced by dialect and generate:sqlite replaced by generate"}`
   - response: count 10; #1 drizzle-sqlite-crud (typescript, score 103.38): Drizzle ORM + better-sqlite3 CRUD
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: no drizzle-kit config recipe (stack filter 0); top1 drizzle-sqlite-crud is migrations-free
22. **F22 [major, false_match]** task T062
   - tool: `search_recipes`; arguments: `{"query": "celery task just hangs forever no error, redis broker... also how do i retry when the external api is down"}`
   - response: count 10; #1 celery-redis-fakeredis-results (python, score 135.82): Celery 5 on Redis with fakeredis-backed idempotency, tested offline in eager mode
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 celery-redis-fakeredis-results configures Celery on Redis but shows an idempotency lock, not retries/backoff or time limits/visibility settings for hanging tasks
23. **F23 [major, false_match]** task T066
   - tool: `search_recipes`; arguments: `{"query": "upload big csv to s3 in chunks python without loading whole file into memory"}`
   - response: count 10; #1 csv-parse-stringify-streams (typescript, score 51.49): Streaming CSV transform with csv-parse + csv-stringify
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: s1 top1 is TypeScript csv-parse streaming (same memory concern, wrong language, no S3); s2 boto3-moto-s3-presigned does uploads/listing/presign but no multipart or streaming upload
24. **F24 [major, false_match]** task T068
   - tool: `search_recipes`; arguments: `{"query": "logging json for fastapi w request id in every line, uvicorn access logs too pls"}`
   - response: count 10; #1 structlog-fastapi-request-id (python, score 96.49): FastAPI request ids in structlog contextvars, tested with capture_logs
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 structlog-fastapi-request-id covers JSON logs with a request id but nothing about routing uvicorn access logs through the same formatter
25. **F25 [major, false_match]** task T070
   - tool: `search_recipes`; arguments: `{"query": "jwt token expired error handling + refresh token flow in fastapi pls, getting 500 instead of 401"}`
   - response: count 10; #1 fastapi-jwt-auth (python, score 70.25): FastAPI + PyJWT bearer auth
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 fastapi-jwt-auth is FastAPI+PyJWT bearer auth but its summary has no refresh tokens or expired-token 401 handling; the only refresh-token recipe shown is Flask
26. **F26 [major, false_match]** task T071
   - tool: `search_recipes`; arguments: `{"query": "jwt verify keeps saying invalid signature in node even tho secret is right, also how do refresh tokens"}`
   - response: count 10; #1 flask-jwt-extended-auth (python, score 54.76): Flask 3 + Flask-JWT-Extended access and refresh tokens
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: s1 top1 is a Python Flask-JWT-Extended refresh-token recipe (same topic, wrong language) for a Node query; Express+jsonwebtoken recipes exist (passport-jwt, express-jwt-auth) but none shows refresh tokens
27. **F27 [major, false_match]** task T072
   - tool: `search_recipes`; arguments: `{"query": "axios retry 3 times w backoff but only on 503 and dont go over api limit of 10 req/sec"}`
   - response: count 10; #1 axios-retry-nock (typescript, score 140.03): Axios + axios-retry with exponential backoff, tested with nock
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 axios-retry-nock covers axios-retry backoff (429/5xx, easy to narrow to 503) but no request-rate limiter; no bottleneck+axios recipe in results
28. **F28 [major, false_match]** task T075
   - tool: `search_recipes`; arguments: `{"query": "express 5 crashes on startup TypeError: Missing parameter name at 1 path-to-regexp"}`
   - response: count 10; #1 express5-async-error-handling (typescript, score 67.31): express 5 async error handling
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 express5-async-error-handling is Express 5.3.0 but about async errors; nothing shows v5 path syntax (named wildcards) that fixes the path-to-regexp crash
29. **F29 [major, false_match]** task T076
   - tool: `search_recipes`; arguments: `{"query": "prisma too many connections on vercel serverless, connection pool exhausted what do"}`
   - response: count 10; #1 prisma-sqlite-adapter (typescript, score 69.77): Prisma 7 + SQLite via better-sqlite3 adapter
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 prisma-sqlite-adapter is Prisma 7 with a SQLite driver adapter; nothing on a client singleton or serverless Postgres pooling (connection_limit, pgbouncer, Accelerate)
30. **F30 [major, false_match]** task T078
   - tool: `search_recipes`; arguments: `{"query": "drizzle migrate sqlite how?? kit generate doesnt do anything"}`
   - response: count 10; #1 drizzle-sqlite-crud (typescript, score 102.67): Drizzle ORM + better-sqlite3 CRUD
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 drizzle-sqlite-crud is drizzle+better-sqlite3 but explicitly migrations-free table creation; nothing shows drizzle-kit generate or migrate(); stack filter with drizzle-kit returns 0 (relabelled partial for consistency with T059)
31. **F31 [major, false_match]** task T079
   - tool: `search_recipes`; arguments: `{"query": "openai streaming response in express and send it to the browser as SSE chunks"}`
   - response: count 10; #1 openai-streaming-mock (typescript, score 106.72): OpenAI Node SDK streaming chat completions, tested with a mocked SSE fetch
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 openai-streaming-mock covers Node SDK streaming and aborts but not Express or SSE output; stack [openai,express] returns 0
32. **F32 [major, false_match]** task T085
   - tool: `search_recipes`; arguments: `{"query": "generate PDF invoice from an HTML Jinja2 template with WeasyPrint"}`
   - response: count 10; #1 jinja2-markupsafe-email-templates (python, score 64.6): Jinja2 sandboxed email templates with autoescape and custom filters
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: no WeasyPrint recipe (stack filter 0); top1 Jinja2 email templates covers only the templating half; #4 is TypeScript pdf-lib
33. **F33 [major, false_match]** task T088
   - tool: `search_recipes`; arguments: `{"query": "implement an LRU cache from scratch in Python without functools or any library, O(1) get and put"}`
   - response: count 10; #1 lru-cache-ttl (typescript, score 100.98): lru-cache TTL eviction and size limits
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: trap task: top1 is the TypeScript lru-cache library; s2 top1 is diskcache+cachetools; both are library-based caches that the task excludes
34. **F34 [major, false_match]** task T090
   - tool: `search_recipes`; arguments: `{"query": "Litestar app with msgspec Struct request bodies and dependency injection"}`
   - response: count 10; #1 litestar-guards-di (python, score 109.3): Litestar app with DI, role guards and exception handlers
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: code: litestar-guards-di has Provide-based DI but no request bodies and no msgspec Structs at all; no Litestar+msgspec recipe in the index
35. **F35 [major, false_match]** task T091
   - tool: `search_recipes`; arguments: `{"query": "Effect-TS: decode input with Schema, typed tagged errors, and provide a service via Layer"}`
   - response: count 10; #1 effect-schema-vitest (typescript, score 103.91): Effect 4 Schema classes, typed errors and retries, tested with @effect/vitest
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 effect-schema-vitest (effect 4.0.5) covers Schema decoding and TaggedError but its summary has no service tag or Layer, a core part of the task
36. **F36 [major, false_match]** task T092
   - tool: `search_recipes`; arguments: `{"query": "Bun.serve websocket server with pub/sub topics"}`
   - response: count 10; #1 ws-zod-message-protocol (typescript, score 21.61): ws WebSocket server with a Zod-validated message protocol
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: no Bun recipe; top1 ws-zod-message-protocol is a Node ws room-chat server: same topic (websocket rooms) but not Bun.serve pub/sub
37. **F37 [major, false_match]** task T094
   - tool: `search_recipes`; arguments: `{"query": "rate limiter using a Cloudflare Durable Object in a Worker"}`
   - response: count 10; #1 rate-limiter-flexible-memory (typescript, score 66.08): rate-limiter-flexible in-memory limiters
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: no Cloudflare Workers/Durable Object recipe; top1 rate-limiter-flexible in-memory matches the rate-limit topic but cannot work as a Durable Object
38. **F38 [major, false_match]** task T095
   - tool: `search_recipes`; arguments: `{"query": "Temporal TypeScript SDK workflow with signals and queries"}`
   - response: count 10; #1 temporal-polyfill-dates (typescript, score 47.88): Temporal polyfill PlainDate and Duration
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: name collision: top1 is the JS Temporal date polyfill, not the Temporal workflow SDK; no @temporalio recipe (stack filter 0)
39. **F39 [major, false_match]** task T098
   - tool: `search_recipes`; arguments: `{"query": "generate JSON Schema from existing TypeScript interfaces at build time, not from zod schemas"}`
   - response: count 10; #1 json-schema-to-typescript-codegen (typescript, score 84.88): Generate TypeScript types from JSON Schema with json-schema-to-typescript
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: top1 json-schema-to-typescript goes the opposite direction (JSON Schema -> TS types); #2 is zod z.toJSONSchema which the task excludes; no ts-json-schema-generator recipe (stack filter 0)
40. **F40 [major, false_match]** task T099
   - tool: `search_recipes`; arguments: `{"query": "Stripe Terminal React Native: discover and connect a Bluetooth card reader and collect a payment"}`
   - response: count 10; #1 fastapi-stripe-webhook (python, score 76.21): FastAPI + Stripe webhook signature verification
   - expected: count 0 (no fitting recipe exists in the index) or a clearly unrelated result
   - observed / why it matters: misleading top result: trap task: top results are Stripe webhook recipes (FastAPI, Express, Next.js), which look relevant by name but do nothing for Terminal reader discovery/collection
41. **F41 [major, false_match]**
   - tool: `search_recipes`; arguments: `{"query": "<each of the uncovered task queries>"}`
   - response: result counts on the 55 uncovered tasks: [10]
   - expected: count 0 for at least some uncovered tasks (honest no-match), as the tool description promises ('If nothing matches, write the code yourself')
   - observed / why it matters: none of the 100 unfiltered task queries returned count 0: on all 55 uncovered tasks the server returned 10 results (34 misleading top results, listed above; 21 unrelated: T020, T048, T053, T054, T057, T058, T065, T074, T077, T080, T081, T082, T083, T084, T086, T087, T089, T093, T096, T097, T100). count 0 did occur with a stack filter (37 of my 97 stack-filtered searches) and for some short keyword queries without a stack filter made by arm agents ([{"query": "SettingWithCopyWarning", "language": "python"}, {"query": "SettingWithCopyWarning", "language": "python"}, {"query": "sudoku", "language": "python"}, {"query": "ortools"}, {"query": "sudoku", "language": "python"}, {"query": "ortools"}, {"query": "constraint programming solver", "language": "python"}, {"query": "SettingWithCopyWarning", "language": "python"}, {"query": "sudoku", "language": "python"}, {"query": "ortools"}]), so the server can return zero; it did not for any descriptive task query. The top1 score ranges overlap (fitting top1 35-227, misleading 22-145, unrelated 14-126), so a client cannot use the score as a cutoff.
42. **F42 [major, broken_recipe]**
   - tool: `get_recipe`; arguments: `{"id": "ky-msw-vitest"}`
   - response: setup: "npm install --no-audit --no-fund --ignore-scripts=false"; receipt.environment.runtime: "node v22.23.3" (no npm version given). My run of that setup on Node v22.22.0 with its bundled npm 10.9.4: "npm error Cannot read properties of null (reading 'edgesOut')", exit 1.
   - expected: the published setup command installs on the stated runtime (Node 22)
   - observed / why it matters: 8 of 99 TypeScript recipes (aws-sdk-v3-dynamodb-sqs-vitest, effect-schema-vitest, hono-drizzle-sqlite-api, jose-jwks-verify, jotai-atoms-react-testing-library, ky-msw-vitest, redux-toolkit-rtk-query-msw, trpc-client-server-superjson) crash in npm install with npm 10.9.4, the npm that ships with Node 22. All 8 pass (test counts equal the receipts) when the same setup runs through npx npm@11.6.0. ProvenPin's own runner (runner/lib.mjs, rewriteSetup in the public repo) quietly switches to npm 11.6.0 when npm is older than 11.6, but the served setup command and receipt do not mention it. Classed as an undisclosed environment requirement, not broken recipe code. Evidence: recipes/<id>/run.log and retry_npm116.log.
43. **F43 [minor, other]**
   - tool: `get_recipe`; arguments: `{"id": "<any of the 194 fetched recipes>"}`
   - response: receipt.files lists "recipes/<id>/recipe.yaml": "sha256:...", but files[] has no recipe.yaml entry
   - expected: every file whose hash is in the receipt is served, so a client can recompute receipt.recipe_hash from the response alone
   - observed / why it matters: all 194 receipts list a recipe.yaml that get_recipe does not serve. Every served file's sha256 matched (194/194), but recipe_hash could only be recomputed with recipe.yaml from the public git repo (an anonymous clone). Using only the MCP response, the receipt cannot be checked end to end.
44. **F44 [minor, other]**
   - tool: `get_recipe`; arguments: `{"id": "nestjs-typeorm-sqlite"}`
   - response: get_recipe response has no staleness field; receipts.json for the same recipe has staleness "breaks_on_latest"
   - expected: an agent reading a recipe through MCP is told when it is known to break on the latest library versions, or when staleness was never checked
   - observed / why it matters: receipts.json (generated 2026-10-18T03:59:18Z) carries a staleness status, but neither search_recipes nor get_recipe shows it. In receipts.json 406 of 555 recipes (73%) are 'unchecked', 137 'current', 9 'passes_on_latest' and 3 'breaks_on_latest'. Among the 194 recipes I fetched: 100 unchecked, 87 current, 6 passes_on_latest, 1 breaks_on_latest (nestjs-typeorm-sqlite, still returned by search with no warning).
45. **F45 [minor, other]**
   - tool: `get_recipe`; arguments: `{"id": "<listed recipes>"}`
   - response: title/summary text of each recipe (recipes/<id>/recipe.json)
   - expected: a recipe's title and summary claim only behaviour its code and tests show
   - observed / why it matters: 4 read-only reviewer subagents read every file of the 194 recipes. They found about 20 recipes whose title or summary claims more than the code or tests show, for example: fastapi-sqlalchemy-crud ('CRUD', but only create and read endpoints); cache-manager-memory-store ('wrap loaders', but cache.wrap is never used); js-yaml-zod-config (says unknown keys are rejected, but z.object strips them; 'env defaults' are not implemented); nestjs-zod-validation-pipe (says tested through @nestjs/testing, which is never used); openai-python-respx-mock (title says structured outputs, but the code uses JSON mode); express-stripe-webhook ('dispatch on event type', but there is no per-type routing); drizzle-pglite-postgres ('relations', but no relations() API); kysely-sqlite-queries ('schema migration', but no Migrator); p-map-concurrency-limit ('async iterator', but the input is a plain array); openai-streaming-mock ('handle aborts', but no mid-stream abort is tested); jinja2-sandboxed-user-templates ('hardened', with incomplete resource limits); express-openapi-validator-spec (response validation never tested); fastapi-pydantic-v2-models ('response_model filtering', but nothing is filtered); arktype-schema-validation ('narrow predicates', but no .narrow()); celery-tasks-eager-testing ('in-memory broker', but the broker is bypassed); nextjs-stripe-webhook and nextjs-server-action-zod (Next.js installed but never exercised). Full verbatim lists: recipes/_review_group1..4.txt. The tests that do exist pass.
46. **F46 [major, version_check]**
   - tool: `search_recipes`; arguments: `{"query": "drizzle orm sqlite", "versions": {"drizzle-orm": "0.45.4", "better-sqlite3": "13.0.3"}}`
   - response: #1 drizzle-sqlite-crud score 124.64, compatibility overall 'mismatch' (better-sqlite3 tested 12.11.1, yours 13.0.3); #2 hono-drizzle-sqlite-api score 104.39, overall 'exact'. Without versions: 122.64 and 92.39.
   - expected: the search_recipes description: 'recipes that match the installed versions rank first'; hono-drizzle-sqlite-api (exact) should rank above drizzle-sqlite-crud (mismatch)
   - observed / why it matters: a matching versions map adds a small score bonus (+12 for the exact recipe, +2 for the mismatching one), so a recipe whose pins conflict with the project still ranks first. The compatibility summary on each result shows the mismatch, so an agent that reads it is warned; the ranking alone does not deliver the promise. Checks V21 and V22 did move the matching recipe from a tie to first. (check V23)
47. **F47 [minor, version_check]**
   - tool: `get_recipe`; arguments: `{"id": "express-stripe-webhook", "versions": "<package.json with \"express\": \"^5.2.0\", \"stripe\": \"^23.0.0\">"}`
   - response: stripe: tested 23.0.0, yours '^23.0.0', verdict 'exact'; express: yours '^5.2.0', verdict 'compatible'
   - expected: a semver range in package.json is not reported as an exact match (it can resolve to any 23.x); flag it as a range, or resolve it conservatively
   - observed / why it matters: ranges are stripped of the caret and compared as if they were installed versions; '^23.0.0' becomes 'exact'. package.json without a lockfile is a supported input format, so this case is common. (check V20)
48. **F48 [minor, version_check]**
   - tool: `get_recipe`; arguments: `{"id": "express-stripe-webhook", "versions": ""}`
   - response: compatibility: overall 'unknown', detected_format 'requirements.txt', express and stripe not_in_project with 'Install express@5.3.0 to match the tested setup.'
   - expected: a clear error, or a note that the empty versions input was ignored
   - observed / why it matters: an empty string is accepted, labelled requirements.txt, and every package is reported as missing from the project, which is confusing rather than wrong in a harmful way. Invalid JSON (V24), a number (V26), an array (V27) and an input over 200KB (V28) all got clear, polite errors. (check V25)
49. **F49 [minor, version_check]**
   - tool: `get_recipe`; arguments: `{"id": "fastapi-stripe-webhook", "versions": {"fastapi": "0.144.0", "stripe": "16.0.0", "httpx": "0.28.1"}}`
   - response: pinned: {fastapi 0.143.1, stripe 16.0.0, httpx 0.28.1, pytest 9.1.1}; compatibility.packages: fastapi, stripe, httpx only
   - expected: get_recipe's description: 'comparing each pinned package with the installed one (exact, compatible, mismatch, or not in your project)', so pytest would be not_in_project
   - observed / why it matters: test and dev pins are never compared (pytest in Python recipes; tsx, @types/*, supertest in express-stripe-webhook). This is probably deliberate, but it is undocumented, and an agent is not told that the recipe's tests need pytest 9.1.1 or tsx 4.23.15. All the verdicts that were reported were correct. (checks V10, V14, V16, which I count as incorrect because their pre-registered expectations included the pytest verdict)
50. **F50 [minor, docs]**
   - tool: `None`; arguments: `{"url": "https://provenpin.com/docs/"}`
   - response: "Each package gets a verdict (exact, compatible, mismatch or not in project) with a plain warning, and recipes that match your versions rank first."
   - expected: documented behaviour matches what the server does
   - observed / why it matters: not every pinned package gets a verdict (test/dev pins are skipped), a caret range is called 'exact', and in V23 a mismatching recipe ranked first. See the version_check failures.
51. **F51 [minor, docs]**
   - tool: `None`; arguments: `{"url": "https://provenpin.com/docs/"}`
   - response: "It also carries recipe_hash, one sha256 over the exact recipe files that were tested ... comparing hashes against your copy happens on your side."
   - expected: enough detail to recompute recipe_hash from what get_recipe returns
   - observed / why it matters: the hash construction is not documented, and it covers recipe.yaml, which get_recipe does not serve. I could verify recipe_hash only by reading the runner source and cloning the repo. The page also omits staleness, the forced --ignore-scripts=false, the npm >= 11.6 requirement of 8 recipes, and how to recognize a 'no match' search result.


Version checks (all 28):

| check | tool | recipe | input kind | expected | observed | correct |
|---|---|---|---|---|---|---|
| V01 | get_recipe | express-stripe-webhook | map | express exact, stripe exact | overall exact, format map: express exact (tested 5.3.0, yours 5.3.0); stripe exact (tested 23.0.0, yours 23.0.0) | yes |
| V02 | get_recipe | express-stripe-webhook | map | express compatible (newer patch) | overall compatible, format map: express compatible (tested 5.3.0, yours 5.3.1); stripe exact (tested 23.0.0, yours 23.0.0) | yes |
| V03 | get_recipe | express-stripe-webhook | map | stripe compatible (newer minor) | overall compatible, format map: express exact (tested 5.3.0, yours 5.3.0); stripe compatible (tested 23.0.0, yours 23.4.0) | yes |
| V04 | get_recipe | express-stripe-webhook | map | express mismatch (older major) with a clear warning | overall mismatch, format map: express mismatch (tested 5.3.0, yours 4.21.2); stripe exact (tested 23.0.0, yours 23.0.0) | yes |
| V05 | get_recipe | express-stripe-webhook | map | stripe mismatch (newer major) with a warning | overall mismatch, format map: express exact (tested 5.3.0, yours 5.3.0); stripe mismatch (tested 23.0.0, yours 24.0.0) | yes |
| V06 | get_recipe | express-stripe-webhook | map | express exact, stripe not_in_project | overall exact, format map: express exact (tested 5.3.0, yours 5.3.0); stripe not_in_project (tested 23.0.0, yours None) | yes |
| V07 | get_recipe | drizzle-sqlite-crud | map | drizzle-orm mismatch (0.x minor bump is breaking), better-sqlite3 exact | overall mismatch, format map: drizzle-orm mismatch (tested 0.45.4, yours 0.46.0); better-sqlite3 exact (tested 12.11.1, yours 12.11.1) | yes |
| V08 | get_recipe | drizzle-sqlite-crud | map | drizzle-orm compatible (0.x patch bump) | overall compatible, format map: drizzle-orm compatible (tested 0.45.4, yours 0.45.5); better-sqlite3 exact (tested 12.11.1, yours 12.11.1) | yes |
| V09 | get_recipe | hono-zod-validator | map | @hono/zod-validator mismatch (scoped package, 0.x minor bump), hono and zod exact | overall mismatch, format map: hono exact (tested 4.13.13, yours 4.13.13); zod exact (tested 4.6.7, yours 4.6.7); @hono/zod-validator mismatch (tested 0.9.1, yours 0.10.0) | yes |
| V10 | get_recipe | fastapi-stripe-webhook | map | fastapi mismatch (0.x minor bump), stripe and httpx exact, pytest not_in_project | overall mismatch, format map: fastapi mismatch (tested 0.143.1, yours 0.144.0); stripe exact (tested 16.0.0, yours 16.0.0); httpx exact (tested 0.28.1, yours 0.28.1) | no |
| V11 | get_recipe | express-stripe-webhook | package-lock.json | express exact (5.3.0), stripe mismatch (lockfile has 22.0.0, older major) | overall mismatch, format package-lock.json: express exact (tested 5.3.0, yours 5.3.0); stripe mismatch (tested 23.0.0, yours 22.0.0) | yes |
| V12 | get_recipe | hono-zod-validator | pnpm-lock.yaml | hono exact, @hono/zod-validator exact, zod mismatch (lockfile has 3.25.76, older major) | overall mismatch, format pnpm-lock.yaml: hono exact (tested 4.13.13, yours 4.13.13); zod mismatch (tested 4.6.7, yours 3.25.76); @hono/zod-validator exact (tested 0.9.1, yours 0.9.1) | yes |
| V13 | get_recipe | express-stripe-webhook | yarn.lock | express exact, stripe exact | overall exact, format yarn.lock: express exact (tested 5.3.0, yours 5.3.0); stripe exact (tested 23.0.0, yours 23.0.0) | yes |
| V14 | get_recipe | fastapi-stripe-webhook | requirements.txt | fastapi compatible (0.143.3 vs 0.143.1 patch), stripe exact, httpx exact, pytest not_in_project | overall compatible, format requirements.txt: fastapi compatible (tested 0.143.1, yours 0.143.3); stripe exact (tested 16.0.0, yours 16.0.0); httpx exact (tested 0.28.1, yours 0.28.1) | no |
| V15 | get_recipe | fastapi-stripe-webhook | poetry.lock | fastapi mismatch (0.144.0, 0.x minor), stripe mismatch (15.2.0, older major), httpx exact | overall mismatch, format poetry.lock: fastapi mismatch (tested 0.143.1, yours 0.144.0); stripe mismatch (tested 16.0.0, yours 15.2.0); httpx exact (tested 0.28.1, yours 0.28.1) | yes |
| V16 | get_recipe | fastapi-stripe-webhook | uv.lock | fastapi compatible (0.143.3), stripe exact, httpx exact (pytest not in the lock: not_in_project) | overall compatible, format uv.lock: fastapi compatible (tested 0.143.1, yours 0.143.3); stripe exact (tested 16.0.0, yours 16.0.0); httpx exact (tested 0.28.1, yours 0.28.1) | no |
| V17 | get_recipe | pydantic-settings-config | map | pydantic-settings exact after PEP 503 name normalization (not not_in_project) | overall exact, format map: pydantic exact (tested 2.14.1, yours 2.14.1); pydantic-settings exact (tested 2.16.0, yours 2.16.0) | yes |
| V18 | get_recipe | marshmallow-sqlalchemy-flask-api | requirements.txt | Flask-SQLAlchemy==3.1.1 matches flask-sqlalchemy exact; Flask==3.1.3 exact; marshmallow==4.3.1 mismatch (recipe pins 3.26.1, newer major) | overall mismatch, format requirements.txt: flask exact (tested 3.1.3, yours 3.1.3); flask-sqlalchemy exact (tested 3.1.1, yours 3.1.1); marshmallow-sqlalchemy not_in_project (tested 1.5.0, yours None); marshmallow mismatch (tested 3.26.1, yours 4.3.1); sqlalchemy not_in_project (tested 2.0.36, yours None) | yes |
| V19 | get_recipe | express-stripe-webhook | package.json | express exact, stripe exact (exact specs in package.json) | overall exact, format package.json: express exact (tested 5.3.0, yours 5.3.0); stripe exact (tested 23.0.0, yours 23.0.0) | yes |
| V20 | get_recipe | express-stripe-webhook | package.json | caret ranges (^5.2.0, ^23.0.0) are not reported as exact; either resolved conservatively or flagged as unknown | overall compatible, format package.json: express compatible (tested 5.3.0, yours ^5.2.0); stripe exact (tested 23.0.0, yours ^23.0.0) | no |
| V21 | search_recipes | - | map | express-stripe-webhook ranks first and results carry a compatibility summary | with versions: express-stripe-webhook (117.95, exact), fastapi-stripe-webhook (101.95, mismatch), nextjs-stripe-webhook (80.95, exact), stripe-checkout-mocked-http (67.34, exact) | same query without versions: express-stripe-webhook (105.95), fastapi-stripe-webhook (105.95), nextjs-stripe-webhook (74.95), stripe-checkout-mocked-http (61.34) | yes |
| V22 | search_recipes | - | requirements.txt | fastapi-stripe-webhook ranks first (matches the Python versions) | with versions: fastapi-stripe-webhook (121.95, compatible), express-stripe-webhook (101.95, mismatch), nextjs-stripe-webhook (70.95, mismatch), stripe-checkout-mocked-http (57.34, mismatch) | same query without versions: express-stripe-webhook (105.95), fastapi-stripe-webhook (105.95), nextjs-stripe-webhook (74.95), stripe-checkout-mocked-http (61.34) | yes |
| V23 | search_recipes | - | map | recipes pinning better-sqlite3 13.0.3 (hono-drizzle-sqlite-api) rank above those pinning 12.11.1 (drizzle-sqlite-crud, drizzle-zod-insert-schemas), unlike the unfiltered order | with versions: drizzle-sqlite-crud (124.64, mismatch), hono-drizzle-sqlite-api (104.39, exact), drizzle-zod-insert-schemas (94.05, mismatch), drizzle-pglite-postgres (85.83, exact) | same query without versions: drizzle-sqlite-crud (122.64), hono-drizzle-sqlite-api (92.39), drizzle-zod-insert-schemas (92.05), drizzle-pglite-postgres (79.83) | no |
| V24 | get_recipe | express-stripe-webhook | malformed | clear, polite error (or explicit 'could not parse' note), no crash | isError, status 200: versions looks like JSON but could not be parsed. | yes |
| V25 | get_recipe | express-stripe-webhook | malformed | clear error or a note that versions were ignored, no crash | overall unknown, format requirements.txt: express not_in_project (tested 5.3.0, yours None); stripe not_in_project (tested 23.0.0, yours None) | no |
| V26 | get_recipe | express-stripe-webhook | malformed | schema validation error (versions must be object or string), no crash | isError, status 200: versions must be an object like {"zod": "3.23.8"} or the text of a lockfile or manifest. | yes |
| V27 | search_recipes | - | malformed | schema validation error for an array, no crash | isError, status 200: versions must be an object like {"zod": "3.23.8"} or the text of a lockfile or manifest. | yes |
| V28 | get_recipe | fastapi-stripe-webhook | requirements.txt | input over the documented 200KB limit gets a clear size error or an explicit truncation note, no crash | isError, status 200: versions is too large (max 200KB). Pass a {package: version} map or just the relevant part of the lockfile. | yes |


## 5. Security and safety notes

What I looked for. Before running anything, four read-only reviewer subagents (same model) read every file of all 194 recipes, and I checked every setup command against an allowlist (only four distinct forms occur) and read the aiohttp fixture flagged as major before deciding to run it. They looked for:
- network calls in tests
- install or postinstall scripts
- eval or exec on strings
- obfuscated or encoded blobs
- unpinned or misspelled dependencies (possible typosquats)
- reads of secrets
- writes outside the project or the temp folder
- telemetry
- surprising setup commands

A scripted scan (`scan.py`) backed this up. The verbatim reviewer reports are in `recipes/_review_group1..4.txt`. Every recipe was run in a fresh temp folder with a temp HOME, a whitelisted environment (no tokens, no proxy variables) and reachable hosts limited to the package registries.

Findings: no install or lifecycle scripts in any recipe's own package.json, no obfuscated code, no reads of secrets, no typosquat-looking or URL/git dependencies, and every external host in the tests is stubbed in-process, with the exceptions flagged below. Tool descriptions (tools/list): no hidden instructions and no requests for secrets or files. They use directive, promotional wording ('Call this BEFORE writing glue code...'), which pushes agents to call the tool even when it cannot help, and that matters given the no-match finding. The claim 'Used only for this call, never stored' cannot be verified from outside. Responses add a `hint` field ('Call get_recipe with an id for the full files.'), which is benign.

- **S01 [major]** aiohttp-pytest-plugin-client — conftest.py:18-25 (autouse session fixture): Test fixture issues a privileged SIOCSIFFLAGS ioctl to bring the host 'lo' interface up when it is down: it changes the machine's network configuration outside the project, the change outlives the tests, and OSError is swallowed silently. Read before running; in this container lo was already UP (flags 0x9), so the write path could not trigger and the recipe was run (recipes/aiohttp-pytest-plugin-client/RUN_DECISION.txt).
- **S02 [minor]** (several recipes) — setup command of 97 of the 99 TypeScript recipes fetched: setup is 'npm install --no-audit --no-fund --ignore-scripts=false', which forces dependency lifecycle (install/postinstall) scripts to run even when the user has ignore-scripts=true configured as a safeguard. Native packages such as better-sqlite3 then download or compile binaries at install time. The other 2 (Prisma) run plain npm install plus the Prisma CLI.
- **S03 [minor]** (several recipes) — dependency manifests of all 194 recipes fetched: Only direct dependencies are pinned. No recipe ships a lockfile (package-lock.json, pnpm-lock.yaml, uv.lock) or hashed requirements, so transitive versions float at install time. A future transitive release can change what gets installed, and nothing pins it to what the receipt tested. The get_recipe description promises 'the exact pinned dependency versions'; that holds for direct dependencies only. Three Python recipes also import a library they do not pin (S16).
- **S04 [minor]** prisma-sqlite-adapter — setup: npm install ... && npx prisma db push && npx prisma generate (also prisma-sqlite-transactions): The Prisma CLI may download engine binaries and send CLI usage telemetry to Prisma servers unless CHECKPOINT_DISABLE is set. The recipe does not mention this. I set CHECKPOINT_DISABLE=1 in my runs.
- **S05 [minor]** axios-retry-nock — test/client.test.ts:7-8: nock.disableNetConnect() is never called, so unmatched requests can reach the real network. Observed (executed): on my first run, with HTTPS_PROXY set in the environment, axios sent the request to the egress proxy instead of nock, which answered 403, and the test failed. The test passed once the proxy variables were removed.
- **S06 [minor]** openai-structured-output-respx — tests/test_extract.py:7,18-21: Tests target the real api.openai.com host and rely entirely on respx interception; a code comment says the SDK's default client used to bypass respx. The API key is fake, so a leak would fail rather than bill anyone.
- **S07 [minor]** mdx-compile-evaluate — src/render.ts:15: evaluate() compiles and runs the MDX string as JavaScript, which is effectively eval and safe only for trusted content. The recipe does not warn about this.
- **S08 [minor]** jinja2-sandboxed-user-templates — renderer.py:28-30: The recipe is described as hardened, but its output cap is checked only after each chunk is rendered, and there is no time limit. One expression, such as a huge string repetition, can still exhaust memory or CPU.
- **S09 [minor]** fastapi-jinja2-htmx-partials — templates/base.html:5: Served pages load an unversioned remote script (https://unpkg.com/htmx.org) with no Subresource Integrity hash.
- **S10 [minor]** jinja2-markupsafe-email-templates — email_templates.py:10-12: The link filter escapes URLs but never checks their scheme, so javascript: hrefs get through, in a recipe tagged security.
- **S11 [minor]** ws-zod-message-protocol — src/server.ts:25: WebSocketServer({port}) listens on all interfaces, not only localhost, so the test server is reachable from the network while tests run (the summary says 'ephemeral localhost port'). No maxPayload is set.
- **S12 [minor]** express-jwt-auth — src/app.ts:4,22: When JWT_SECRET is unset the code silently falls back to a hardcoded secret, and the demo /login accepts any username with a fixed password. Similar demo-only logins appear in express-passport-jwt, fastify-jwt-auth and nestjs-jwt-guard-testing; code copied from these as-is would be insecure.
- **S13 [info]** diskcache-cachetools-tiered — tiered.py:19: diskcache unpickles stored values, so pointing the cache at a shared or untrusted directory allows code execution. The tests use tmp_path.
- **S14 [info]** tenacity-httpx-respx-backoff — client.py:36-38: Retry-After is honoured with no upper bound, so a server can stall the client indefinitely.
- **S15 [info]** drf-django-filter-viewset — shop/api.py:25-30: The ModelViewSet has no authentication or permission classes, so anonymous users can create, update and delete records.
- **S16 [info]** sqlmodel-relationships-sqlite — models.py:1-2 (also fastapi-async-sqlalchemy-aiosqlite-pytest app.py:5, pydantic-settings-nested-sources config.py:1): The code imports a library directly (sqlalchemy or pydantic) without pinning it, relying on another dependency to pull it in at a floating version.
- **S17 [info]** express5-async-error-handling — src/app.ts:25 (also koa-router-zod-supertest src/app.ts:30-31): The central error handler sends the raw err.message to clients on unexpected errors, which can leak internals.
- **S18 [info]** undici-mockagent-p-retry — src/client.ts:17: new URL(path, baseUrl) lets an absolute or protocol-relative path override the host.
- **S19 [info]** fastapi-websocket-auth — app/main.py:4,17: Demo tokens are sent in the query string, so they end up in access logs.
- **S20 [info]** pino-redaction-custom-transport — src/logger.ts:18: Redact paths are case-sensitive and the wildcard covers only one level, so headers.Authorization or a nested password would not be redacted.


Also observed in the arm runs: one with_recipe agent guessed a recipe id that does not exist (`pp-ortools-sudoku-cpsat-c5e8`), and the server answered clearly ('No recipe with id ... Use search_recipes to find ids.'). One agent started two client commands at once against its instructions; the pp.py lock still serialized them (logged 2-3 s apart).

## 6. What I could not verify

- Per-recipe results inside GitHub Actions runs: job logs and artifacts need a GitHub login. I checked 5 run_url pages at run level (they exist, the workflow is recipes.yml, status Success, job and artifact names match the recipes, timing consistent with last_passed_at). Part of 3 of those pages came through the fetch tool's summary rather than verbatim text.
- That lockfiles and versions input are 'never stored' (docs and tool description).
- How often recipes are re-tested. I saw one scheduled run (run #53) and several push runs. Staleness is 'unchecked' for 73% of receipts.json, and I did not test recipes against the latest library versions myself.
- Pro tier behaviour, any limit above 10 results, and rate limits under load (deliberately not tested).
- The docs' local-server instructions (`cd server && npm install && npm run dev`).
- That arm subagents never read files outside their working folder. They were told not to; their folders contain no build artifacts (__pycache__, node_modules, .venv), and grading used only their files, but I did not audit every tool call.
- Complete coverage ground truth. 'Uncovered' means I found no fitting recipe in receipts.json, list_stacks and the recipes index (with code checks for borderline cases); a fitting recipe I overlooked would turn an 'uncovered' outcome into a search miss.
- Whether the recipes behave correctly beyond their own tests. The reviewers found about 20 summaries that claim more than the tests check (Failures section).
- Real-world effect for users whose model is weaker than the one tested, or who let agents install and run code. My arm design forbade both.

## 7. Reproducibility notes

- Date and time (UTC): 2026-10-18T03:50:19Z to 2026-10-18T06:05:16Z.
- Model: claude-opus-5-5 (Claude Opus 5.5); session_context.model and external_metadata.last_served_model from get_session both read claude-opus-5-5; a probe subagent launched like the arm agents reported claude-opus-5-5.
- Effort: xhigh (session effort_level, also passed as effort to every subagent; the prompt suggested high; the in-context reasoning_effort value was 40 for both me and the probe subagent).
- Product and environment: Claude Code 2.1.302 in a claude.ai/code cloud container (Linux), started from the desktop app; Ubuntu 24.04.5 LTS, Linux 6.18.44 x86_64; Python 3.13.16; Node v22.22.0. npm 10.9.4 (Node 22 default), uv 0.11.32. Outbound traffic goes through an egress proxy: mcp.provenpin.com, provenpin.com and github.com were allowed by [the owner] at 03:56Z. The GitHub web UI and API for the repo were refused by the proxy, but an anonymous git clone worked. Recipe runs and grading used a temp HOME and an environment allowlist with no tokens and no proxy variables, so the code could reach only the package registries.
- How I reached the server: the prompt's `pp.py` MCP client over HTTPS (JSON-RPC to https://mcp.provenpin.com/mcp, protocol 2025-06-18), plus plain GETs for /health, receipts.json, the recipes index and the docs page, an anonymous `git clone` of github.com/provenpin/provenpin, and the WebFetch tool for 5 run_url pages (approved by [the owner]). access_mode: mixed.
- clientInfo sent: {"name": "independent-bench-claude", "version": "1.0"} (MCP initialize, protocolVersion 2025-06-18). User-Agent sent: independent-bench-claude/1.0 (independent benchmark) on every pp.py request and every curl GET (receipts.json, recipes index, docs); the 5 GitHub run_url pages were read with the WebFetch tool, which sends its own User-Agent.
- /health at start: ok=True, recipes=523, index_generated_at=2026-10-18T00:59:12.564Z. At end: ok=True, recipes=555, index_generated_at=2026-10-18T03:59:18.754Z.
- The index changed once, before Step 2: 523 recipes (00:59:12.564Z) -> 555 (03:59:18.754Z), and it stayed at 555 for every later phase check (search, recipes, arms, versions, latency, docs, end). All search, recipe, arm, version and latency results come from the 555-recipe index. pp.py is the prompt's client with two benchmark additions: an inter-process flock so that concurrent subagents still send one request at a time with the 1 s gap, and a PP_TAG field in the log. A third addition (logging 429/5xx before the retry) came mid-Step 4; no 429/5xx was ever logged. All 819 logged calls returned HTTP 200.
- Changes to the prompt's pp.py (the original is kept as logs/pp.original.py): an inter-process flock around each HTTP request so that concurrent arm agents still send one request at a time with the 1 s gap; a `tag` field in logs/calls.jsonl naming the run; logging of any 429/5xx before the retry (added mid-Step 4; none occurred). Request behaviour and headers are otherwise unchanged.
- Anchoring: I did not open provenpin.com/benchmarks/ (the docs footer links to /benchmarks/token-test-2026-10/ and /experiment/; neither was opened), any ProvenPin blog or marketing post, or the cloned repo's README.md or benchmark/ folder. From the repo I read runner/lib.mjs and the CI workflow to understand recipe_hash and setup rewriting. Tasks, fitting definitions and acceptance tests were written before I looked at the index, stacks or source.
- Seed 706465614: search order uses Random(seed).shuffle and arm pair order uses Random(seed+1). Task prompts were regenerated once, with clarifications from the acceptance-test builders, before any search; acceptance tests were frozen (hashes in acceptance_manifest.json).
- Arms: Fresh general-purpose subagent for every one of the 174 runs (29 tasks x 3 runs x 2 arms), same model and effort as me, each with an empty working folder and a TASK.md. Both arms got the identical task text; with_recipe also got a per-run pp.py shim (search/get only) and the prompt's instruction to search, get and use the best match if it fits, plus 'name the recipe id you used'. Neither arm could install packages, run code or use the web, so the arms differ only in ProvenPin access. This is stricter than a normal agent session and is my design choice. Grading: I copied the produced files into a clean, pre-built environment with the task's pinned versions and ran my acceptance tests, written and frozen before any search. A failure would have gone back to the same subagent with the test output, up to 3 attempts, but every run passed on attempt 1, so the retry path was never used. Pair order was shuffled with Random(seed+1) and the leading arm alternated; the two runs of a pair started together, with up to about 12 agents in flight. Tokens: total_tokens is the Agent tool's reported subagent_tokens (all tokens the subagent processed, including cache reads), with the same meaning in both arms; output-only tokens were not available. The seconds of with_recipe runs include any time spent waiting for the shared pp.py lock when several agents searched at once; I did not measure that wait separately. The acceptance tests did not separate the arms: all 174 runs passed, so the differences are only in time, tokens and code size.
- Environment differences from ProvenPin's runner: Node v22.22.0 with npm 10.9.4 (runner: Node v22.23.3, and npm 11.6.0 forced by its setup rewrite); Python 3.13.16 (same as the receipts). For the 8 npm failures I retried with `npx --yes npm@11.6.0 install ...`, mirroring the runner.
- Disclosure: the commit title of CI run 38883899161 in ProvenPin's public repo reads 'recipes: add 36 [team member] Python drafts', and the benchmark prompt's note asks that this report be sent to '[team member]'. I did not investigate this. It does not change any measurement, but readers judging independence should know about it.
- The prompt suggested effort 'high'; this session ran at 'xhigh' and every subagent was launched with the same setting, so both arms are identical in this respect.

## 8. Machine-readable results

Identical to results.json.

```json
{
 "schema": "provenpin-independent-bench/v1",
 "run": {
  "tester": "independent-bench-claude",
  "model": "claude-opus-5-5 (Claude Opus 5.5); session_context.model and external_metadata.last_served_model from get_session both read claude-opus-5-5; a probe subagent launched like the arm agents reported claude-opus-5-5",
  "effort": "xhigh (session effort_level, also passed as effort to every subagent; the prompt suggested high; the in-context reasoning_effort value was 40 for both me and the probe subagent)",
  "product": "Claude Code 2.1.302 in a claude.ai/code cloud container (Linux), started from the desktop app",
  "started_utc": "2026-10-18T03:50:19Z",
  "finished_utc": "2026-10-18T06:05:16Z",
  "access_mode": "mixed",
  "client_info_sent": "{\"name\": \"independent-bench-claude\", \"version\": \"1.0\"} (MCP initialize, protocolVersion 2025-06-18)",
  "user_agent_sent": "independent-bench-claude/1.0 (independent benchmark) on every pp.py request and every curl GET (receipts.json, recipes index, docs); the 5 GitHub run_url pages were read with the WebFetch tool, which sends its own User-Agent",
  "can_execute_code": true,
  "code_has_internet": "packages_only",
  "environment": {
   "os": "Ubuntu 24.04.5 LTS, Linux 6.18.44 x86_64",
   "python": "3.13.16",
   "node": "v22.22.0",
   "notes": "npm 10.9.4 (Node 22 default), uv 0.11.32. Outbound traffic goes through an egress proxy: mcp.provenpin.com, provenpin.com and github.com were allowed by [the owner] at 03:56Z. The GitHub web UI and API for the repo were refused by the proxy, but an anonymous git clone worked. Recipe runs and grading used a temp HOME and an environment allowlist with no tokens and no proxy variables, so the code could reach only the package registries."
  },
  "health_start": {
   "ok": true,
   "recipes": 523,
   "index_generated_at": "2026-10-18T00:59:12.564Z"
  },
  "health_end": {
   "ok": true,
   "recipes": 555,
   "index_generated_at": "2026-10-18T03:59:18.754Z"
  },
  "notes": "The index changed once, before Step 2: 523 recipes (00:59:12.564Z) -> 555 (03:59:18.754Z), and it stayed at 555 for every later phase check (search, recipes, arms, versions, latency, docs, end). All search, recipe, arm, version and latency results come from the 555-recipe index. pp.py is the prompt's client with two benchmark additions: an inter-process flock so that concurrent subagents still send one request at a time with the 1 s gap, and a PP_TAG field in the log. A third addition (logging 429/5xx before the retry) came mid-Step 4; no 429/5xx was ever logged. All 819 logged calls returned HTTP 200."
 },
 "scores": {
  "tasks_total": 100,
  "coverage_rate": {
   "value": 0.45,
   "n": 100
  },
  "search_top1_rate": {
   "value": 0.8667,
   "n": 45
  },
  "search_top3_rate": {
   "value": 0.9778,
   "n": 45
  },
  "honest_no_match_rate": {
   "value": 0.0,
   "n": 55
  },
  "misleading_top1_on_uncovered_rate": {
   "value": 0.6182,
   "n": 55
  },
  "recipe_run_pass_rate": {
   "value": 1.0,
   "n": 194,
   "level": "executed"
  },
  "integrity_match_rate": {
   "value": 1.0,
   "n": 194,
   "level": "executed"
  },
  "version_check_accuracy": {
   "value": 0.7857,
   "n": 28
  },
  "with_vs_without": {
   "tasks": 29,
   "runs_per_arm_per_task": 3,
   "same_model_and_effort_both_arms": true,
   "with_recipe": {
    "first_try_pass_rate": 1.0,
    "final_pass_rate": 1.0,
    "mean_attempts": 1,
    "median_seconds": 76.1,
    "mean_output_tokens": null,
    "mean_output_chars": 3206.1,
    "mean_total_tokens": 74302.9
   },
   "without_recipe": {
    "first_try_pass_rate": 1.0,
    "final_pass_rate": 1.0,
    "mean_attempts": 1,
    "median_seconds": 65.1,
    "mean_output_tokens": null,
    "mean_output_chars": 3617.5,
    "mean_total_tokens": 68993.6
   },
   "contamination_risk": "low",
   "notes": "Fresh general-purpose subagent for every one of the 174 runs (29 tasks x 3 runs x 2 arms), same model and effort as me, each with an empty working folder and a TASK.md. Both arms got the identical task text; with_recipe also got a per-run pp.py shim (search/get only) and the prompt's instruction to search, get and use the best match if it fits, plus 'name the recipe id you used'. Neither arm could install packages, run code or use the web, so the arms differ only in ProvenPin access. This is stricter than a normal agent session and is my design choice. Grading: I copied the produced files into a clean, pre-built environment with the task's pinned versions and ran my acceptance tests, written and frozen before any search. A failure would have gone back to the same subagent with the test output, up to 3 attempts, but every run passed on attempt 1, so the retry path was never used. Pair order was shuffled with Random(seed+1) and the leading arm alternated; the two runs of a pair started together, with up to about 12 agents in flight. Tokens: total_tokens is the Agent tool's reported subagent_tokens (all tokens the subagent processed, including cache reads), with the same meaning in both arms; output-only tokens were not available. The seconds of with_recipe runs include any time spent waiting for the shared pp.py lock when several agents searched at once; I did not measure that wait separately. The acceptance tests did not separate the arms: all 174 runs passed, so the differences are only in time, tokens and code size."
  },
  "latency_ms": {
   "n": 40,
   "p50": 153.0,
   "p95": 211.0,
   "max": 245,
   "errors": 0,
   "rate_limited": 0
  },
  "docs_clarity_1to5": 3,
  "safety_flags": 20,
  "overall_1to10": 6
 },
 "tasks": [
  {
   "task_id": "T001",
   "language": "python",
   "libraries": [
    "fastapi",
    "sqlalchemy",
    "pydantic"
   ],
   "category": "integration",
   "query": "FastAPI CRUD API with SQLAlchemy 2.0 ORM and Pydantic v2 schemas on SQLite",
   "search_args": {
    "query": "FastAPI CRUD API with SQLAlchemy 2.0 ORM and Pydantic v2 schemas on SQLite"
   },
   "fitting_definition": "Uses FastAPI + SQLAlchemy 2.x ORM (DeclarativeBase/Mapped or 2.0-style select) + Pydantic v2 request/response models; implements at least create and read endpoints with a per-request session dependency against SQLite or another SQL database.",
   "covered": true,
   "result_ids": [
    "fastapi-sqlalchemy-crud",
    "fastapi-pydantic-v2-models",
    "sqlalchemy2-pydantic-v2-from-attributes",
    "fastapi-async-sqlalchemy-aiosqlite-pytest",
    "drizzle-sqlite-crud",
    "sqlmodel-fastapi-crud",
    "pydantic-v2-discriminated-unions-fastapi",
    "sqlalchemy-alembic-autogenerate-check",
    "sqlalchemy-alembic-migrations",
    "fastapi-pydantic-background-tasks"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": "fastapi-sqlalchemy-crud",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 2,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.3,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 77.7,
      "output_tokens": null,
      "output_chars": 5109,
      "total_tokens": 73580
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 94.5,
      "output_tokens": null,
      "output_chars": 5333,
      "total_tokens": 73451
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 96.3,
      "output_tokens": null,
      "output_chars": 5057,
      "total_tokens": 74690
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 82.2,
      "output_tokens": null,
      "output_chars": 5905,
      "total_tokens": 68411
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 105.7,
      "output_tokens": null,
      "output_chars": 6122,
      "total_tokens": 69184
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 82.0,
      "output_tokens": null,
      "output_chars": 5661,
      "total_tokens": 68735
     }
    ]
   },
   "latency_ms": 155,
   "notes": "fastapi-sqlalchemy-crud: FastAPI + SQLAlchemy 2 typed models + per-request session dependency, pydantic 2.14.1; #4 async variant also fits; #3 lacks FastAPI"
  },
  {
   "task_id": "T002",
   "language": "python",
   "libraries": [
    "fastapi",
    "pyjwt",
    "pwdlib"
   ],
   "category": "integration",
   "query": "FastAPI OAuth2 password flow login that issues JWT access tokens and protects routes",
   "search_args": {
    "query": "FastAPI OAuth2 password flow login that issues JWT access tokens and protects routes"
   },
   "fitting_definition": "FastAPI token endpoint (OAuth2PasswordRequestForm or equivalent), password hash verification, JWT creation with exp (PyJWT, python-jose or joserfc), and a dependency that returns 401 for missing, invalid or expired tokens.",
   "covered": true,
   "result_ids": [
    "fastapi-oauth2-pyjwt-scopes",
    "fastapi-jwt-auth",
    "fastapi-argon2-login",
    "flask-jwt-extended-auth",
    "fastapi-dependency-injector-wiring",
    "fastapi-httpx-asyncclient-lifespan",
    "fastapi-pydantic-v2-models",
    "fastapi-websocket-auth",
    "fastapi-cashews-memory-cache",
    "fastapi-pydantic-settings-dependency"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 5,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.3,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 138,
   "notes": "fastapi-oauth2-pyjwt-scopes: OAuth2 password login issuing PyJWT tokens with pwdlib hashes; #2 fastapi-jwt-auth also fits"
  },
  {
   "task_id": "T003",
   "language": "python",
   "libraries": [
    "httpx",
    "tenacity"
   ],
   "category": "integration",
   "query": "retry httpx requests with tenacity exponential backoff on 5xx and timeouts",
   "search_args": {
    "query": "retry httpx requests with tenacity exponential backoff on 5xx and timeouts"
   },
   "fitting_definition": "An httpx call wrapped with tenacity (decorator or Retrying) using exponential wait, retrying only on 5xx and transport/timeout errors (not 4xx), with a stop condition.",
   "covered": true,
   "result_ids": [
    "httpx-tenacity-retry",
    "tenacity-httpx-respx-backoff",
    "tenacity-retry-stop-wait",
    "requests-cache-sqlite-backend",
    "axios-retry-nock",
    "httpx-respx-api-client",
    "httpx-pydantic-typed-client",
    "httpx-respx-pagination-oauth",
    "fastapi-httpx-asyncclient-lifespan",
    "starlette-httpx-asgi-client"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": "httpx-tenacity-retry",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.4,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 50.1,
      "output_tokens": null,
      "output_chars": 2491,
      "total_tokens": 67481
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 44.5,
      "output_tokens": null,
      "output_chars": 1754,
      "total_tokens": 65603
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 43.6,
      "output_tokens": null,
      "output_chars": 1774,
      "total_tokens": 66827
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 44.1,
      "output_tokens": null,
      "output_chars": 2054,
      "total_tokens": 63708
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 80.6,
      "output_tokens": null,
      "output_chars": 2309,
      "total_tokens": 66062
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 52.8,
      "output_tokens": null,
      "output_chars": 2580,
      "total_tokens": 65083
     }
    ]
   },
   "latency_ms": 178,
   "notes": "httpx-tenacity-retry retries 5xx/429/timeouts with backoff and max attempts (adapt: drop 429); #2 async variant also adaptable; #3 is tenacity without httpx"
  },
  {
   "task_id": "T004",
   "language": "python",
   "libraries": [
    "celery",
    "redis"
   ],
   "category": "integration",
   "query": "Celery task with automatic retries and exponential backoff using Redis broker",
   "search_args": {
    "query": "Celery task with automatic retries and exponential backoff using Redis broker"
   },
   "fitting_definition": "Celery app configured with a Redis broker URL and a task using autoretry_for/retry_backoff or self.retry with a growing countdown, with max_retries set.",
   "covered": false,
   "result_ids": [
    "celery-redis-fakeredis-results",
    "django-celery-eager-signals",
    "celery-tasks-eager-testing",
    "redis-fakeredis-pipeline",
    "celery-beat-schedule-crontab",
    "effect-schema-vitest",
    "tenacity-httpx-respx-backoff",
    "axios-retry-nock",
    "httpx-tenacity-retry",
    "tenacity-retry-stop-wait"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 1.8,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 150,
   "notes": "top1 celery-redis-fakeredis-results configures Celery on a Redis broker but is about an idempotency lock; no result mentions autoretry/retry_backoff/self.retry"
  },
  {
   "task_id": "T005",
   "language": "python",
   "libraries": [
    "pydantic-settings",
    "pydantic",
    "python-dotenv"
   ],
   "category": "integration",
   "query": "pydantic-settings load config from env vars and .env file with nested settings and prefix",
   "search_args": {
    "query": "pydantic-settings load config from env vars and .env file with nested settings and prefix"
   },
   "fitting_definition": "BaseSettings from pydantic_settings with SettingsConfigDict(env_file=..., env_prefix=..., env_nested_delimiter=...) and at least one nested model.",
   "covered": true,
   "result_ids": [
    "pydantic-settings-config",
    "pydantic-settings-nested-sources",
    "pydantic-settings-yaml-secrets",
    "python-dotenv-pydantic-settings-env",
    "fastapi-pydantic-settings-dependency",
    "pydantic-settings-dotenv-secrets",
    "sqlalchemy2-pydantic-v2-from-attributes",
    "fastapi-pydantic-v2-models",
    "orjson-pydantic-v2-roundtrip",
    "hypothesis-polyfactory-models"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 1.1,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 134,
   "notes": "pydantic-settings-config: env prefixes, nested settings, .env (pydantic-settings 2.16.0); #2 env_nested_delimiter, #3 YAML+env, #4 dotenv precedence all fit"
  },
  {
   "task_id": "T006",
   "language": "python",
   "libraries": [
    "typer",
    "rich"
   ],
   "category": "integration",
   "query": "Typer CLI with subcommands printing a Rich table and a progress bar",
   "search_args": {
    "query": "Typer CLI with subcommands printing a Rich table and a progress bar"
   },
   "fitting_definition": "Typer app with two or more commands using a rich Table/Console for output and a rich progress bar; ideally tested with typer.testing.CliRunner.",
   "covered": true,
   "result_ids": [
    "rich-typer-progress-cli",
    "typer-rich-table-cli",
    "typer-rich-table-export",
    "click-rich-progress",
    "typer-cli-testing",
    "cyclopts-annotated-cli",
    "tanstack-table-core-sorting",
    "commander-zod-cli",
    "clipanion-cli-parser",
    "click-pytest-freezegun-scheduler"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 6,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 1.3,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 177,
   "notes": "rich-typer-progress-cli: Typer + rich Progress + Table tested with CliRunner (single command; adding a second subcommand is trivial). #2/#3 also Typer+Rich tables"
  },
  {
   "task_id": "T007",
   "language": "python",
   "libraries": [
    "structlog",
    "fastapi"
   ],
   "category": "integration",
   "query": "structlog JSON logging in FastAPI with request id bound to every log line",
   "search_args": {
    "query": "structlog JSON logging in FastAPI with request id bound to every log line"
   },
   "fitting_definition": "structlog configured with a JSON renderer and contextvars merging, plus FastAPI middleware that binds a per-request id (and ideally echoes it in a response header).",
   "covered": true,
   "result_ids": [
    "structlog-fastapi-request-id",
    "structlog-stdlib-json-renderer",
    "structlog-bound-logger-context",
    "fastapi-jinja2-htmx-partials",
    "prometheus-client-fastapi-metrics",
    "fastapi-async-sqlalchemy-aiosqlite-pytest",
    "fastapi-dependency-injector-wiring",
    "fastapi-slowapi-rate-limit",
    "fastapi-stripe-webhook",
    "fastapi-cashews-memory-cache"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 5,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 1.8,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 135,
   "notes": "structlog-fastapi-request-id: ASGI middleware binding a request id into structlog contextvars, JSON output, tested with capture_logs"
  },
  {
   "task_id": "T008",
   "language": "python",
   "libraries": [
    "stripe",
    "fastapi"
   ],
   "category": "integration",
   "query": "FastAPI Stripe webhook endpoint verifying the Stripe-Signature header",
   "search_args": {
    "query": "FastAPI Stripe webhook endpoint verifying the Stripe-Signature header"
   },
   "fitting_definition": "FastAPI route that reads the raw request body and calls stripe.Webhook.construct_event with the signing secret, returns 400 on an invalid signature and dispatches on event type.",
   "covered": true,
   "result_ids": [
    "fastapi-stripe-webhook",
    "express-stripe-webhook",
    "nextjs-stripe-webhook",
    "stripe-checkout-mocked-http",
    "pydantic-v2-discriminated-unions-fastapi",
    "fastapi-websocket-auth",
    "fastapi-jinja2-htmx-partials",
    "fastapi-async-sqlalchemy-aiosqlite-pytest",
    "fastapi-dependency-overrides-httpx",
    "fastapi-prometheus-instrumentator"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": "fastapi-stripe-webhook",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.6,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 111.7,
      "output_tokens": null,
      "output_chars": 5184,
      "total_tokens": 73393
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 139.2,
      "output_tokens": null,
      "output_chars": 4044,
      "total_tokens": 77807
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 76.1,
      "output_tokens": null,
      "output_chars": 3188,
      "total_tokens": 69844
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 92.3,
      "output_tokens": null,
      "output_chars": 4777,
      "total_tokens": 69158
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 90.0,
      "output_tokens": null,
      "output_chars": 5140,
      "total_tokens": 69222
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 118.2,
      "output_tokens": null,
      "output_chars": 5362,
      "total_tokens": 71427
     }
    ]
   },
   "latency_ms": 179,
   "notes": "fastapi-stripe-webhook: raw body signature verification + dispatch on event type, stripe 16.0.0"
  },
  {
   "task_id": "T009",
   "language": "python",
   "libraries": [
    "boto3",
    "moto",
    "pytest"
   ],
   "category": "integration",
   "query": "boto3 S3 upload and download tested with moto mock_aws in pytest",
   "search_args": {
    "query": "boto3 S3 upload and download tested with moto mock_aws in pytest"
   },
   "fitting_definition": "boto3 S3 client/resource functions for put/get (or upload/download) plus pytest tests that use moto's mock_aws (moto 5 API).",
   "covered": true,
   "result_ids": [
    "boto3-moto-s3-presigned",
    "boto3-moto-dynamodb-sqs",
    "aws-sdk-v3-s3-client-mock",
    "aws-sdk-v3-dynamodb-sqs-vitest",
    "pytest-mock-spy-autospec",
    "python-multipart-starlette-forms",
    "axios-mock-adapter-client",
    "fastify-multipart-upload",
    "loguru-pytest-caplog",
    "ioredis-cache-aside-mock"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": "boto3-moto-s3-presigned",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.8,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 41.2,
      "output_tokens": null,
      "output_chars": 3790,
      "total_tokens": 67254
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 34.5,
      "output_tokens": null,
      "output_chars": 2983,
      "total_tokens": 66206
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 42.3,
      "output_tokens": null,
      "output_chars": 3743,
      "total_tokens": 67321
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 28.5,
      "output_tokens": null,
      "output_chars": 3705,
      "total_tokens": 62228
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 28.2,
      "output_tokens": null,
      "output_chars": 3327,
      "total_tokens": 62053
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 24.8,
      "output_tokens": null,
      "output_chars": 3392,
      "total_tokens": 61853
     }
    ]
   },
   "latency_ms": 154,
   "notes": "boto3-moto-s3-presigned: boto3 S3 upload/listing/delete helpers tested with moto 5.2.4"
  },
  {
   "task_id": "T010",
   "language": "python",
   "libraries": [
    "pandas",
    "sqlalchemy"
   ],
   "category": "integration",
   "query": "pandas read_sql and to_sql with a SQLAlchemy 2 engine",
   "search_args": {
    "query": "pandas read_sql and to_sql with a SQLAlchemy 2 engine"
   },
   "fitting_definition": "pandas read_sql/read_sql_query with a SQLAlchemy 2.x engine or connection, and DataFrame.to_sql writing back, against SQLite or Postgres.",
   "covered": true,
   "result_ids": [
    "pandas-sqlalchemy-to-sql",
    "pandas-openpyxl-excel-report",
    "sklearn-columntransformer-pipeline",
    "pandas-pyarrow-parquet-roundtrip",
    "pandas-pandera-validation",
    "sqlmodel-sqlalchemy-core-select",
    "sqlalchemy-async-repository-pattern",
    "sqlalchemy2-pydantic-v2-from-attributes",
    "sqlalchemy-aiosqlite-session-factory",
    "sqlalchemy-alembic-migrations"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 6,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.4,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 628,
   "notes": "pandas-sqlalchemy-to-sql: read_sql + to_sql through a SQLAlchemy 2 engine on sqlite, pandas 3.0.6 pinned"
  },
  {
   "task_id": "T011",
   "language": "python",
   "libraries": [
    "duckdb",
    "polars"
   ],
   "category": "integration",
   "query": "query parquet files with DuckDB and return a Polars DataFrame",
   "search_args": {
    "query": "query parquet files with DuckDB and return a Polars DataFrame"
   },
   "fitting_definition": "DuckDB SQL over parquet files (read_parquet or a glob) with the result converted to Polars (.pl() or pl.from_arrow).",
   "covered": true,
   "result_ids": [
    "duckdb-polars-analytics",
    "polars-pydantic-row-validation",
    "polars-pandera-validation",
    "pyarrow-parquet-roundtrip",
    "pandas-pyarrow-parquet-roundtrip",
    "tanstack-query-core-cache",
    "fast-glob-picomatch-files",
    "jsonpath-plus-query",
    "qs-nested-query-strings",
    "pandas-openpyxl-excel-report"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": "duckdb-polars-analytics",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 5,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 6.1,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 49.2,
      "output_tokens": null,
      "output_chars": 2145,
      "total_tokens": 67916
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 53.5,
      "output_tokens": null,
      "output_chars": 2764,
      "total_tokens": 67688
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 40.1,
      "output_tokens": null,
      "output_chars": 2125,
      "total_tokens": 66661
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 81.2,
      "output_tokens": null,
      "output_chars": 3830,
      "total_tokens": 67856
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 48.0,
      "output_tokens": null,
      "output_chars": 2649,
      "total_tokens": 65279
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 54.7,
      "output_tokens": null,
      "output_chars": 3142,
      "total_tokens": 64724
     }
    ]
   },
   "latency_ms": 140,
   "notes": "duckdb-polars-analytics: DuckDB 1.5.6 queries returning .pl() results with a parquet round trip, polars 2.0.0"
  },
  {
   "task_id": "T012",
   "language": "python",
   "libraries": [
    "httpx",
    "respx",
    "pytest"
   ],
   "category": "integration",
   "query": "mock httpx calls in pytest using respx",
   "search_args": {
    "query": "mock httpx calls in pytest using respx"
   },
   "fitting_definition": "Code that makes httpx requests plus pytest tests that use respx routes or a mock router (side effects, call assertions).",
   "covered": true,
   "result_ids": [
    "httpx-authlib-oauth2-mock",
    "tenacity-httpx-respx-backoff",
    "httpx-pydantic-typed-client",
    "httpx-respx-api-client",
    "httpx-respx-pagination-oauth",
    "httpx-tenacity-retry",
    "openai-python-respx-mock",
    "openai-structured-output-respx",
    "quart-httpx-asgi-client",
    "fastapi-dependency-overrides-httpx"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 6,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.3,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 147,
   "notes": "all top results are httpx 0.28.1 + respx 0.23.1 + pytest 9.1.1 recipes with respx-mocked tests"
  },
  {
   "task_id": "T013",
   "language": "python",
   "libraries": [
    "sqlalchemy",
    "alembic"
   ],
   "category": "integration",
   "query": "Alembic autogenerate migrations for SQLAlchemy 2.0 declarative models",
   "search_args": {
    "query": "Alembic autogenerate migrations for SQLAlchemy 2.0 declarative models"
   },
   "fitting_definition": "Alembic env.py with target_metadata from SQLAlchemy 2.x DeclarativeBase models, a revision (autogenerated or written), and running upgrade head (ideally tested).",
   "covered": true,
   "result_ids": [
    "sqlalchemy-alembic-migrations",
    "sqlalchemy-alembic-autogenerate-check",
    "flask-migrate-sqlite",
    "sqlalchemy-hybrid-events",
    "sqlalchemy-factory-boy-sqlite",
    "sqlalchemy-aiosqlite-session-factory",
    "fastapi-sqlalchemy-crud",
    "marshmallow-sqlalchemy-flask-api",
    "sqlalchemy2-pydantic-v2-from-attributes",
    "flask-sqlalchemy-app-factory"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 2,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.6,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 182,
   "notes": "sqlalchemy-alembic-migrations: programmatic upgrade/downgrade + autogenerate check with SQLAlchemy 2 models (alembic 1.20.0); #2 autogenerate drift check also adaptable"
  },
  {
   "task_id": "T014",
   "language": "python",
   "libraries": [
    "flask",
    "flask-sqlalchemy",
    "marshmallow"
   ],
   "category": "integration",
   "query": "Flask REST API with Flask-SQLAlchemy models and marshmallow schema validation",
   "search_args": {
    "query": "Flask REST API with Flask-SQLAlchemy models and marshmallow schema validation"
   },
   "fitting_definition": "Flask app with Flask-SQLAlchemy model(s) and marshmallow Schema load/dump, returning 400 with validation errors.",
   "covered": true,
   "result_ids": [
    "marshmallow-sqlalchemy-flask-api",
    "flask-migrate-sqlite",
    "flask-sqlalchemy-app-factory",
    "flask-marshmallow-webargs",
    "flask-login-sqlalchemy-sessions",
    "marshmallow-dataclass-schema",
    "marshmallow-oneofschema-polymorphic",
    "flask-wtforms-csrf-validation",
    "flask-jwt-extended-auth",
    "fastapi-sqlalchemy-crud"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 5,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.3,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 145,
   "notes": "marshmallow-sqlalchemy-flask-api: Flask + Flask-SQLAlchemy + marshmallow load/dump with validation errors (422, trivially 400). Note it pins marshmallow 3.26.1, an older major than the 4.3.1 hint"
  },
  {
   "task_id": "T015",
   "language": "python",
   "libraries": [
    "django",
    "djangorestframework"
   ],
   "category": "integration",
   "query": "Django REST Framework ModelViewSet with token authentication",
   "search_args": {
    "query": "Django REST Framework ModelViewSet with token authentication"
   },
   "fitting_definition": "DRF ModelSerializer + ModelViewSet registered on a router, with TokenAuthentication (rest_framework.authtoken) and an IsAuthenticated permission.",
   "covered": false,
   "result_ids": [
    "django-drf-api",
    "drf-django-filter-viewset",
    "drf-simplejwt-auth",
    "django-celery-eager-signals",
    "django-pytest-factoryboy",
    "django-ninja-schema-crud",
    "koa-router-zod-supertest",
    "octokit-rest-msw-pagination",
    "pyotp-totp-freezegun",
    "hono-drizzle-sqlite-api"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.9,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 194,
   "notes": "top1 django-drf-api has ModelViewSet+router+serializer but its summary says token-free permissions; #3 drf-simplejwt is JWT not DRF TokenAuthentication; core token-auth requirement missing"
  },
  {
   "task_id": "T016",
   "language": "python",
   "libraries": [
    "openai",
    "pydantic"
   ],
   "category": "integration",
   "query": "OpenAI Python SDK structured outputs parsed into a Pydantic model",
   "search_args": {
    "query": "OpenAI Python SDK structured outputs parsed into a Pydantic model"
   },
   "fitting_definition": "openai client using a parse helper (chat.completions.parse with response_format=Model, or responses.parse with text_format=Model) that returns a Pydantic instance; tests mock the HTTP layer.",
   "covered": true,
   "result_ids": [
    "openai-python-respx-mock",
    "openai-structured-output-respx",
    "openai-sdk-mocked-tool-calls",
    "openai-streaming-mock",
    "langchain-core-fake-llm-python",
    "python-dotenv-pydantic-settings-env",
    "orjson-pydantic-v2-roundtrip",
    "deepdiff-pydantic-compare",
    "feedparser-pydantic-models",
    "fastapi-pydantic-v2-models"
   ],
   "top1_correct": false,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.2,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 141,
   "notes": "#2 openai-structured-output-respx uses chat.completions.parse with a Pydantic response_format (fits); top1 validates JSON output with Pydantic, which may not use the parse helper (verify)"
  },
  {
   "task_id": "T017",
   "language": "python",
   "libraries": [
    "anthropic",
    "pydantic"
   ],
   "category": "integration",
   "query": "Anthropic Python SDK tool use loop with tool input schema from a Pydantic model",
   "search_args": {
    "query": "Anthropic Python SDK tool use loop with tool input schema from a Pydantic model"
   },
   "fitting_definition": "anthropic messages.create with tools whose input_schema comes from a Pydantic model, handling tool_use blocks, sending tool_result back and looping until stop_reason is end_turn.",
   "covered": false,
   "result_ids": [
    "anthropic-sdk-mocked-tool-use",
    "python-dotenv-pydantic-settings-env",
    "openai-python-respx-mock",
    "orjson-pydantic-v2-roundtrip",
    "langchain-core-fake-llm-python",
    "deepdiff-pydantic-compare",
    "anthropic-streaming-mock",
    "fastapi-pydantic-v2-models",
    "openai-sdk-mocked-tool-calls",
    "sqlalchemy2-pydantic-v2-from-attributes"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 2,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 6.4,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 140,
   "notes": "top1 is the Anthropic TypeScript SDK tool-use loop (same topic, wrong language) for a Python query; no Python anthropic recipe in s2; stack [anthropic,pydantic] returns 0"
  },
  {
   "task_id": "T018",
   "language": "python",
   "libraries": [
    "httpx",
    "aiolimiter"
   ],
   "category": "integration",
   "query": "fetch many URLs concurrently with httpx AsyncClient limited to 5 requests per second using aiolimiter",
   "search_args": {
    "query": "fetch many URLs concurrently with httpx AsyncClient limited to 5 requests per second using aiolimiter"
   },
   "fitting_definition": "httpx.AsyncClient + aiolimiter.AsyncLimiter (or an equivalent limiter) with asyncio.gather, enforcing a requests-per-second cap.",
   "covered": true,
   "result_ids": [
    "aiolimiter-httpx-rate-limit",
    "requests-cache-sqlite-backend",
    "fastapi-httpx-asyncclient-lifespan",
    "fastapi-slowapi-rate-limit",
    "tenacity-httpx-respx-backoff",
    "httpx-pydantic-typed-client",
    "httpx-respx-pagination-oauth",
    "httpx-tenacity-retry",
    "quart-httpx-asgi-client",
    "starlette-httpx-asgi-client"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 6,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.5,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 128,
   "notes": "aiolimiter-httpx-rate-limit: AsyncLimiter throttling an httpx AsyncClient, exact versions"
  },
  {
   "task_id": "T019",
   "language": "python",
   "libraries": [
    "opentelemetry-sdk",
    "opentelemetry-instrumentation-fastapi",
    "fastapi"
   ],
   "category": "integration",
   "query": "OpenTelemetry tracing for FastAPI with console or in-memory span exporter",
   "search_args": {
    "query": "OpenTelemetry tracing for FastAPI with console or in-memory span exporter"
   },
   "fitting_definition": "TracerProvider + span processor/exporter configured and FastAPIInstrumentor (or manual spans) on a FastAPI app, producing spans for requests.",
   "covered": false,
   "result_ids": [
    "opentelemetry-sdk-inmemory-span",
    "fastapi-async-sqlalchemy-aiosqlite-pytest",
    "fastapi-cashews-memory-cache",
    "sqlmodel-fastapi-crud",
    "fastapi-argon2-login",
    "fastapi-slowapi-rate-limit",
    "fastapi-pydantic-background-tasks",
    "fastapi-dependency-overrides-httpx",
    "fastapi-httpx-asyncclient-lifespan",
    "structlog-fastapi-request-id"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 5,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 1.1,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 144,
   "notes": "top1 opentelemetry-sdk-inmemory-span sets up the SDK with InMemorySpanExporter but has no FastAPI app or instrumentation; stack filter 0"
  },
  {
   "task_id": "T020",
   "language": "python",
   "libraries": [
    "redis",
    "fastapi"
   ],
   "category": "integration",
   "query": "cache FastAPI endpoint responses in Redis with TTL using redis.asyncio",
   "search_args": {
    "query": "cache FastAPI endpoint responses in Redis with TTL using redis.asyncio"
   },
   "fitting_definition": "redis.asyncio client used in a FastAPI route or dependency to get/set cached values with an expiry (fakeredis in tests is acceptable).",
   "covered": false,
   "result_ids": [
    "requests-cache-sqlite-backend",
    "redis-fakeredis-pipeline",
    "celery-redis-fakeredis-results",
    "fastapi-cashews-memory-cache",
    "lru-cache-ttl",
    "pydantic-v2-discriminated-unions-fastapi",
    "fastapi-async-sqlalchemy-aiosqlite-pytest",
    "fastapi-websocket-auth",
    "ioredis-cache-aside-mock",
    "prometheus-client-fastapi-metrics"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.7,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 208,
   "notes": "top1 requests-cache with sqlite (client-side HTTP cache, different stack); #2 redis pipelines without FastAPI; #4 FastAPI with cashews in-memory, not Redis; stack [redis,fastapi] returns 0"
  },
  {
   "task_id": "T021",
   "language": "typescript",
   "libraries": [
    "express",
    "zod"
   ],
   "category": "integration",
   "query": "Express middleware validating request body with zod and returning 400 with errors",
   "search_args": {
    "query": "Express middleware validating request body with zod and returning 400 with errors"
   },
   "fitting_definition": "Express app + zod schema (safeParse/parse) in a reusable middleware, 400 response with structured issues, typed handler.",
   "covered": true,
   "result_ids": [
    "express-zod-validation",
    "http-errors-express-error-middleware",
    "joi-express-validation",
    "express-validator-supertest",
    "express-openapi-validator-spec",
    "express5-async-error-handling",
    "express-jwt-auth",
    "nestjs-zod-validation-pipe",
    "twilio-webhook-signature-express",
    "cors-express-preflight"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": "express-zod-validation",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 4.7,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 85.8,
      "output_tokens": null,
      "output_chars": 3236,
      "total_tokens": 70546
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 90.5,
      "output_tokens": null,
      "output_chars": 3404,
      "total_tokens": 70738
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 70.4,
      "output_tokens": null,
      "output_chars": 2603,
      "total_tokens": 68122
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 65.1,
      "output_tokens": null,
      "output_chars": 3080,
      "total_tokens": 64960
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 44.8,
      "output_tokens": null,
      "output_chars": 2437,
      "total_tokens": 63485
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 78.6,
      "output_tokens": null,
      "output_chars": 3597,
      "total_tokens": 69094
     }
    ]
   },
   "latency_ms": 126,
   "notes": "express-zod-validation: Express 5 + Zod 4 reusable middleware returning 400 with field errors"
  },
  {
   "task_id": "T022",
   "language": "typescript",
   "libraries": [
    "fastify",
    "@fastify/jwt",
    "jose"
   ],
   "category": "integration",
   "query": "Fastify JWT auth: sign token on login, verify on protected routes",
   "search_args": {
    "query": "Fastify JWT auth: sign token on login, verify on protected routes"
   },
   "fitting_definition": "Fastify server signing JWTs on a login route and verifying them in an onRequest/preHandler hook (via @fastify/jwt or jose), 401 on an invalid token.",
   "covered": true,
   "result_ids": [
    "fastify-jwt-auth",
    "fastify-json-schema",
    "fastify-zod-type-provider",
    "fastify-multipart-upload",
    "fastify-swagger-openapi",
    "flask-jwt-extended-auth",
    "hono-jwt-auth",
    "express-jwt-auth",
    "nestjs-jwt-guard-testing",
    "drf-simplejwt-auth"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 4.5,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 143,
   "notes": "fastify-jwt-auth: Fastify 5 + @fastify/jwt sign/verify with an authenticate preHandler"
  },
  {
   "task_id": "T023",
   "language": "typescript",
   "libraries": [
    "hono",
    "zod",
    "@hono/zod-validator"
   ],
   "category": "integration",
   "query": "Hono API validating JSON body and query params with zod validator",
   "search_args": {
    "query": "Hono API validating JSON body and query params with zod validator"
   },
   "fitting_definition": "Hono app using zValidator from @hono/zod-validator for json and query targets, reading c.req.valid, 400 on invalid input.",
   "covered": true,
   "result_ids": [
    "hono-rpc-typed-client",
    "hono-zod-validator",
    "hono-drizzle-sqlite-api",
    "hono-jwt-auth",
    "hono-zod-openapi",
    "hono-valibot-validator",
    "svix-webhook-verify-hono",
    "validator-js-sanitize",
    "zod-v4-json-schema-export",
    "nestjs-zod-validation-pipe"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": "hono-rpc-typed-client",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 2,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.0,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 53.6,
      "output_tokens": null,
      "output_chars": 2356,
      "total_tokens": 67684
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 71.4,
      "output_tokens": null,
      "output_chars": 2699,
      "total_tokens": 69831
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 60.9,
      "output_tokens": null,
      "output_chars": 2781,
      "total_tokens": 69285
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 53.9,
      "output_tokens": null,
      "output_chars": 2434,
      "total_tokens": 64689
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 67.7,
      "output_tokens": null,
      "output_chars": 2744,
      "total_tokens": 65812
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 51.5,
      "output_tokens": null,
      "output_chars": 2790,
      "total_tokens": 64653
     }
    ]
   },
   "latency_ms": 139,
   "notes": "hono-rpc-typed-client and hono-zod-validator (JSON + query) use @hono/zod-validator 0.9.1 with zod 4.6.7; #3/#4 also use zValidator"
  },
  {
   "task_id": "T024",
   "language": "typescript",
   "libraries": [
    "drizzle-orm",
    "better-sqlite3",
    "drizzle-kit"
   ],
   "category": "integration",
   "query": "Drizzle ORM with better-sqlite3 schema, migrations and relational queries",
   "search_args": {
    "query": "Drizzle ORM with better-sqlite3 schema, migrations and relational queries"
   },
   "fitting_definition": "drizzle-orm sqlite-core schema with the better-sqlite3 driver, migrations (drizzle-kit or migrate()), inserts and queries (relations or joins).",
   "covered": false,
   "result_ids": [
    "drizzle-sqlite-crud",
    "hono-drizzle-sqlite-api",
    "drizzle-zod-insert-schemas",
    "drizzle-pglite-migrations",
    "knex-better-sqlite3-migrations",
    "prisma-sqlite-adapter",
    "drizzle-pglite-postgres",
    "kysely-sqlite-queries",
    "better-sqlite3-zod-transactions",
    "mikroorm-sqlite-entities"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 1,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 9.5,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 151,
   "notes": "top1 drizzle-sqlite-crud is drizzle+better-sqlite3 but explicitly migrations-free; the migrations recipe (#4) is PGlite/Postgres, not better-sqlite3"
  },
  {
   "task_id": "T025",
   "language": "typescript",
   "libraries": [
    "prisma",
    "@prisma/client",
    "express"
   ],
   "category": "integration",
   "query": "Express REST API with Prisma CRUD and handling unique constraint errors",
   "search_args": {
    "query": "Express REST API with Prisma CRUD and handling unique constraint errors"
   },
   "fitting_definition": "Express routes using Prisma Client for CRUD, catching the unique-constraint error (P2002) and returning 409.",
   "covered": true,
   "result_ids": [
    "prisma-sqlite-transactions",
    "http-errors-express-error-middleware",
    "express5-async-error-handling",
    "prisma-sqlite-adapter",
    "joi-express-validation",
    "express-validator-supertest",
    "express-openapi-validator-spec",
    "twilio-webhook-signature-express",
    "cors-express-preflight",
    "passport-local-express-session"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 26.5,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 136,
   "notes": "prisma-sqlite-transactions: Prisma 7 CRUD with unique-constraint errors (the library-specific part); wrapping in Express routes is generic glue. stack [prisma,@prisma/client] returns 0 because stacks use prisma only"
  },
  {
   "task_id": "T026",
   "language": "typescript",
   "libraries": [
    "@trpc/server",
    "@trpc/client",
    "zod"
   ],
   "category": "integration",
   "query": "tRPC v11 router with zod input validation and typed client",
   "search_args": {
    "query": "tRPC v11 router with zod input validation and typed client"
   },
   "fitting_definition": "tRPC v11 initTRPC router with zod-validated procedures, an HTTP adapter (standalone or fetch) and a typed client (createTRPCClient + httpBatchLink) or createCaller.",
   "covered": true,
   "result_ids": [
    "trpc-zod-router",
    "koa-router-zod-supertest",
    "trpc-client-server-superjson",
    "nextjs-route-handler-zod",
    "trpc-context-auth-middleware",
    "msw-fetch-api-client",
    "zod-v4-json-schema-export",
    "hono-rpc-typed-client",
    "nestjs-zod-validation-pipe",
    "react-router-loader-action"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": "trpc-context-auth-middleware",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.6,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 76.5,
      "output_tokens": null,
      "output_chars": 3926,
      "total_tokens": 75851
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 90.0,
      "output_tokens": null,
      "output_chars": 4111,
      "total_tokens": 76216
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 82.0,
      "output_tokens": null,
      "output_chars": 3941,
      "total_tokens": 76162
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 60.1,
      "output_tokens": null,
      "output_chars": 4486,
      "total_tokens": 65894
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 65.3,
      "output_tokens": null,
      "output_chars": 4345,
      "total_tokens": 65667
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 58.4,
      "output_tokens": null,
      "output_chars": 4585,
      "total_tokens": 66028
     }
    ]
   },
   "latency_ms": 153,
   "notes": "trpc-zod-router: tRPC 11 router with zod inputs tested via createCaller (accepted by the definition); #3 adds fetch adapter + createTRPCClient/httpBatchLink. stack [@trpc/server,@trpc/client] misses #1 because its stack is named trpc"
  },
  {
   "task_id": "T027",
   "language": "typescript",
   "libraries": [
    "bullmq",
    "ioredis"
   ],
   "category": "integration",
   "query": "BullMQ queue and worker with retries and exponential backoff",
   "search_args": {
    "query": "BullMQ queue and worker with retries and exponential backoff"
   },
   "fitting_definition": "BullMQ Queue.add with attempts + exponential backoff, a Worker processing jobs, Redis connection config (ioredis), and handling of failed/completed events.",
   "covered": false,
   "result_ids": [
    "p-queue-concurrency",
    "p-queue-priority",
    "tenacity-httpx-respx-backoff",
    "axios-retry-nock",
    "effect-schema-vitest",
    "httpx-tenacity-retry",
    "tenacity-retry-stop-wait",
    "undici-mockagent-p-retry",
    "arq-fakeredis-job-queue",
    "huey-sqlite-immediate"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 1.8,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 178,
   "notes": "no BullMQ recipe (stack filter 0); top1 p-queue-concurrency is an in-process queue that looks like a job-queue answer but is not Redis-backed BullMQ with retries"
  },
  {
   "task_id": "T028",
   "language": "typescript",
   "libraries": [
    "axios",
    "axios-retry"
   ],
   "category": "integration",
   "query": "axios-retry retry on network errors and 5xx with exponential delay",
   "search_args": {
    "query": "axios-retry retry on network errors and 5xx with exponential delay"
   },
   "fitting_definition": "axios instance configured with axios-retry (retries, exponentialDelay, retryCondition for network/5xx errors), ideally tested.",
   "covered": true,
   "result_ids": [
    "axios-retry-nock",
    "axios-mock-adapter-client",
    "undici-mockagent-p-retry",
    "boltons-funcutils-retry",
    "http-errors-express-error-middleware",
    "vitest-fake-timers-es-toolkit",
    "cockatiel-retry-circuit-policy",
    "tenacity-retry-stop-wait",
    "tenacity-httpx-respx-backoff",
    "httpx-tenacity-retry"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.6,
    "error": "my environment's HTTPS_PROXY made axios bypass nock; passed with proxy variables removed",
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 185,
   "notes": "axios-retry-nock: axios 1.20.0 + axios-retry 4.5.0 with exponential backoff on 5xx/429, tested with nock"
  },
  {
   "task_id": "T029",
   "language": "typescript",
   "libraries": [
    "stripe",
    "express"
   ],
   "category": "integration",
   "query": "Stripe webhook handler in Express with raw body signature verification",
   "search_args": {
    "query": "Stripe webhook handler in Express with raw body signature verification"
   },
   "fitting_definition": "Express route using express.raw (not express.json) and stripe.webhooks.constructEvent with the endpoint secret; 400 on failure; switch on event type.",
   "covered": true,
   "result_ids": [
    "express-stripe-webhook",
    "fastapi-stripe-webhook",
    "nextjs-stripe-webhook",
    "twilio-webhook-signature-express",
    "stripe-checkout-mocked-http",
    "express5-async-error-handling",
    "express-validator-supertest",
    "http-errors-express-error-middleware",
    "joi-express-validation",
    "passport-local-express-session"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 4.6,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 278,
   "notes": "express-stripe-webhook: Express 5 raw body + constructEvent, stripe 23.0.0"
  },
  {
   "task_id": "T030",
   "language": "typescript",
   "libraries": [
    "jose",
    "express"
   ],
   "category": "integration",
   "query": "verify OIDC JWT access tokens with a remote JWKS in Express using jose",
   "search_args": {
    "query": "verify OIDC JWT access tokens with a remote JWKS in Express using jose"
   },
   "fitting_definition": "jose createRemoteJWKSet + jwtVerify with issuer/audience checks inside Express middleware, 401 on failure.",
   "covered": true,
   "result_ids": [
    "jose-jwks-verify",
    "bcryptjs-jose-sessions",
    "express-passport-jwt",
    "twilio-webhook-signature-express",
    "cors-express-preflight",
    "express-jwt-auth",
    "http-errors-express-error-middleware",
    "joi-express-validation",
    "passport-local-express-session",
    "express-openapi-validator-spec"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": "jose-jwks-verify",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 5.4,
    "error": "npm 10.9.4 crashed in npm install (edgesOut); passed when the same setup ran through npx npm@11.6.0, as ProvenPin's runner does",
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 47.6,
      "output_tokens": null,
      "output_chars": 2609,
      "total_tokens": 69887
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 59.3,
      "output_tokens": null,
      "output_chars": 2917,
      "total_tokens": 72148
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 37.0,
      "output_tokens": null,
      "output_chars": 2507,
      "total_tokens": 69153
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 55.8,
      "output_tokens": null,
      "output_chars": 2992,
      "total_tokens": 65031
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 44.5,
      "output_tokens": null,
      "output_chars": 3491,
      "total_tokens": 63986
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 38.4,
      "output_tokens": null,
      "output_chars": 2938,
      "total_tokens": 62999
     }
    ]
   },
   "latency_ms": 131,
   "notes": "jose-jwks-verify: jose 6.2.12 JWKS verification with issuer/audience/expiry checks (library-specific core); Express middleware wiring is generic glue; remote vs local JWKS to verify. stack [jose,express] returns 0"
  },
  {
   "task_id": "T031",
   "language": "typescript",
   "libraries": [
    "vitest",
    "msw"
   ],
   "category": "integration",
   "query": "mock fetch in Vitest tests with MSW handlers",
   "search_args": {
    "query": "mock fetch in Vitest tests with MSW handlers"
   },
   "fitting_definition": "msw/node setupServer with http.get/post handlers and HttpResponse, vitest beforeAll/afterEach/afterAll lifecycle, and code under test that uses fetch.",
   "covered": true,
   "result_ids": [
    "ky-msw-vitest",
    "redux-toolkit-rtk-query-msw",
    "openapi-fetch-msw",
    "ofetch-msw-client",
    "graphql-request-msw",
    "ioredis-cache-aside-mock",
    "msw-fetch-api-client",
    "urql-core-msw-cache-exchange",
    "octokit-rest-msw-pagination",
    "trpc-client-server-superjson"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 14.8,
    "error": "npm 10.9.4 crashed in npm install (edgesOut); passed when the same setup ran through npx npm@11.6.0, as ProvenPin's runner does",
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 165,
   "notes": "ky-msw-vitest and RTK Query + MSW + Vitest use msw 3.0.3 setupServer-style mocking with vitest 5.0.4; #3/#4 MSW with fetch-based clients"
  },
  {
   "task_id": "T032",
   "language": "typescript",
   "libraries": [
    "pino",
    "pino-http",
    "express"
   ],
   "category": "integration",
   "query": "Express request logging with pino-http, request ids and redacted authorization header",
   "search_args": {
    "query": "Express request logging with pino-http, request ids and redacted authorization header"
   },
   "fitting_definition": "pino-http middleware with genReqId (or header-based ids) and redact paths covering the authorization header, mounted on an Express app.",
   "covered": true,
   "result_ids": [
    "express-pino-http-logging",
    "pino-redaction-custom-transport",
    "http-errors-express-error-middleware",
    "express-validator-supertest",
    "express-openapi-validator-spec",
    "cors-express-preflight",
    "express5-async-error-handling",
    "joi-express-validation",
    "twilio-webhook-signature-express",
    "passport-local-express-session"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 2,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.4,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 130,
   "notes": "express-pino-http-logging: Express 5 + pino-http with request ids and redacted auth headers, exact versions"
  },
  {
   "task_id": "T033",
   "language": "typescript",
   "libraries": [
    "openai",
    "zod"
   ],
   "category": "integration",
   "query": "OpenAI Node SDK structured outputs with a zod schema",
   "search_args": {
    "query": "OpenAI Node SDK structured outputs with a zod schema"
   },
   "fitting_definition": "openai Node SDK using the zodResponseFormat/zodTextFormat helpers with chat.completions.parse or responses.parse, returning typed parsed output.",
   "covered": false,
   "result_ids": [
    "openai-sdk-mocked-tool-calls",
    "openai-python-respx-mock",
    "openai-structured-output-respx",
    "openai-streaming-mock",
    "zod-v4-json-schema-export",
    "vercel-ai-sdk-mock-model-tools",
    "anthropic-sdk-mocked-tool-use",
    "mcp-sdk-inmemory-tools",
    "nestjs-zod-validation-pipe",
    "zod-to-openapi-document-generation"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": "none",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 2,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 5.4,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 63.8,
      "output_tokens": null,
      "output_chars": 1816,
      "total_tokens": 69302
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 52.4,
      "output_tokens": null,
      "output_chars": 1984,
      "total_tokens": 70236
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 62.3,
      "output_tokens": null,
      "output_chars": 1932,
      "total_tokens": 71386
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 44.7,
      "output_tokens": null,
      "output_chars": 1961,
      "total_tokens": 62838
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 33.4,
      "output_tokens": null,
      "output_chars": 1923,
      "total_tokens": 62582
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 53.3,
      "output_tokens": null,
      "output_chars": 1979,
      "total_tokens": 64924
     }
    ]
   },
   "latency_ms": 149,
   "notes": "top1 openai-sdk-mocked-tool-calls is Node SDK + zod but for tool-call arguments, not structured outputs with zodResponseFormat; #2/#3 are Python structured-output recipes; s2 adds zod JSON Schema export and the Vercel AI SDK"
  },
  {
   "task_id": "T034",
   "language": "typescript",
   "libraries": [
    "ai",
    "@ai-sdk/openai",
    "next"
   ],
   "category": "integration",
   "query": "stream LLM chat responses from a Next.js route handler using the Vercel AI SDK",
   "search_args": {
    "query": "stream LLM chat responses from a Next.js route handler using the Vercel AI SDK"
   },
   "fitting_definition": "Next.js app router route handler using streamText from 'ai' with a provider and returning a streaming response (toUIMessageStreamResponse or equivalent).",
   "covered": false,
   "result_ids": [
    "nextjs-route-handler-zod",
    "nextjs-stripe-webhook",
    "nextjs-supabase-auth-middleware",
    "vercel-ai-sdk-mock-model-tools",
    "nextjs-server-action-zod",
    "anthropic-streaming-mock",
    "nextauth-credentials-callbacks",
    "requests-cache-sqlite-backend",
    "openai-streaming-mock",
    "anthropic-sdk-mocked-tool-use"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 12.8,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 129,
   "notes": "top1 is a Next.js 16 route handler with Zod (no AI SDK); #4 vercel-ai-sdk-mock-model-tools covers streamText with a mock model but not a Next.js route returning the stream; stack [ai,@ai-sdk/openai] returns 0"
  },
  {
   "task_id": "T035",
   "language": "typescript",
   "libraries": [
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner"
   ],
   "category": "integration",
   "query": "generate presigned S3 upload URL with AWS SDK v3 in Node",
   "search_args": {
    "query": "generate presigned S3 upload URL with AWS SDK v3 in Node"
   },
   "fitting_definition": "S3Client + PutObjectCommand + getSignedUrl with expiresIn (optionally content type), AWS SDK v3.",
   "covered": true,
   "result_ids": [
    "aws-sdk-v3-s3-client-mock",
    "boto3-moto-s3-presigned",
    "aws-sdk-v3-dynamodb-sqs-vitest",
    "fastify-multipart-upload",
    "python-slugify-unidecode-titles",
    "slugify-url-paths",
    "mcp-sdk-inmemory-tools",
    "anthropic-sdk-mocked-tool-use",
    "anthropic-streaming-mock",
    "boto3-moto-dynamodb-sqs"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 5,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 5.6,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 171,
   "notes": "aws-sdk-v3-s3-client-mock: @aws-sdk/client-s3 + s3-request-presigner 3.1152.0 helpers including locally signed presigned URLs"
  },
  {
   "task_id": "T036",
   "language": "typescript",
   "libraries": [
    "mongoose",
    "express"
   ],
   "category": "integration",
   "query": "Express and Mongoose REST API with schema validation and pagination",
   "search_args": {
    "query": "Express and Mongoose REST API with schema validation and pagination"
   },
   "fitting_definition": "Mongoose model with validators, Express routes for create and list with skip/limit or cursor pagination, validation errors mapped to 400.",
   "covered": false,
   "result_ids": [
    "joi-express-validation",
    "express-openapi-validator-spec",
    "express-validator-supertest",
    "express-zod-validation",
    "twilio-webhook-signature-express",
    "http-errors-express-error-middleware",
    "cors-express-preflight",
    "express5-async-error-handling",
    "passport-local-express-session",
    "octokit-rest-msw-pagination"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 4.2,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 172,
   "notes": "no Mongoose recipe (stack filter 0); top1 joi-express-validation answers schema validation with Joi request validation instead of Mongoose model validators, with no persistence or pagination"
  },
  {
   "task_id": "T037",
   "language": "typescript",
   "libraries": [
    "commander",
    "@inquirer/prompts"
   ],
   "category": "integration",
   "query": "Node CLI with commander subcommands and interactive prompts using @inquirer/prompts",
   "search_args": {
    "query": "Node CLI with commander subcommands and interactive prompts using @inquirer/prompts"
   },
   "fitting_definition": "commander program with subcommands/options plus @inquirer/prompts input/select/confirm prompts.",
   "covered": false,
   "result_ids": [
    "commander-zod-cli",
    "typer-cli-testing",
    "ink-testing-library-cli",
    "clipanion-cli-parser",
    "cyclopts-annotated-cli",
    "click-pytest-freezegun-scheduler",
    "click-rich-progress",
    "typer-rich-table-cli",
    "rich-typer-progress-cli",
    "typer-rich-table-export"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 5,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.0,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 138,
   "notes": "top1 commander-zod-cli covers commander 15 subcommands but no interactive @inquirer/prompts; stack filter 0"
  },
  {
   "task_id": "T038",
   "language": "typescript",
   "libraries": [
    "supertest",
    "express",
    "vitest"
   ],
   "category": "integration",
   "query": "test an Express API with supertest and vitest",
   "search_args": {
    "query": "test an Express API with supertest and vitest"
   },
   "fitting_definition": "Express app exported separately from listen(), with supertest requests in vitest tests asserting status and body.",
   "covered": true,
   "result_ids": [
    "express-validator-supertest",
    "joi-express-validation",
    "express-openapi-validator-spec",
    "http-errors-express-error-middleware",
    "twilio-webhook-signature-express",
    "cors-express-preflight",
    "express5-async-error-handling",
    "passport-local-express-session",
    "koa-router-zod-supertest",
    "express-zod-validation"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 4.4,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 143,
   "notes": "Express 5.3.0 + supertest 7.3.1 recipes; vitest not in their stacks (likely node:test), switching the runner is trivial"
  },
  {
   "task_id": "T039",
   "language": "typescript",
   "libraries": [
    "kysely",
    "pg"
   ],
   "category": "integration",
   "query": "type-safe Kysely queries with node-postgres including a transaction",
   "search_args": {
    "query": "type-safe Kysely queries with node-postgres including a transaction"
   },
   "fitting_definition": "Kysely with PostgresDialect + pg Pool, a typed Database interface, select/insert queries and db.transaction().execute().",
   "covered": true,
   "result_ids": [
    "pg-mem-kysely-postgres-tests",
    "kysely-sqlite-queries",
    "drizzle-pglite-migrations",
    "drizzle-pglite-postgres",
    "authjs-drizzle-adapter-pglite",
    "file-type-buffer-detect",
    "typeguard-runtime-typecheck",
    "chrono-node-reference-date",
    "fastify-zod-type-provider",
    "ical-generator-node-ical-roundtrip"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 6,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 7.0,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 150,
   "notes": "top1 pg-mem-kysely runs Kysely through a node-postgres-compatible adapter with typed queries (swap to a real pg Pool); transaction not explicit in summary (verify). #2 is Kysely on SQLite with a transaction. stack [kysely,pg] returns 0 since pg is not in recipe stacks"
  },
  {
   "task_id": "T040",
   "language": "typescript",
   "libraries": [
    "p-retry",
    "p-limit"
   ],
   "category": "integration",
   "query": "fetch 100 API items with max 5 concurrent requests and retry failures with p-retry",
   "search_args": {
    "query": "fetch 100 API items with max 5 concurrent requests and retry failures with p-retry"
   },
   "fitting_definition": "p-limit concurrency limiter around fetch calls, each wrapped in p-retry (retries, AbortError for non-retryable failures).",
   "covered": false,
   "result_ids": [
    "undici-mockagent-p-retry",
    "requests-cache-sqlite-backend",
    "openapi-fetch-msw",
    "p-limit-concurrency",
    "axios-retry-nock",
    "ollama-js-mocked-fetch",
    "boltons-funcutils-retry",
    "p-timeout-abort",
    "graphql-yoga-schema-context",
    "p-defer-manual"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 5,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.9,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 158,
   "notes": "top1 undici-mockagent-p-retry shows p-retry 8.0.1 with AbortError but no concurrency cap; #4 p-limit-concurrency shows p-limit alone; no recipe combines them (stack filter 0)"
  },
  {
   "task_id": "T041",
   "language": "python",
   "libraries": [
    "pydantic"
   ],
   "category": "version_gotcha",
   "query": "migrate Pydantic v1 models to v2: validator to field_validator, class Config to model_config, orm_mode to from_attributes, .dict() to model_dump()",
   "search_args": {
    "query": "migrate Pydantic v1 models to v2: validator to field_validator, class Config to model_config, orm_mode to from_attributes, .dict() to model_dump()"
   },
   "fitting_definition": "Recipe on Pydantic 2.x using field_validator/model_validator, ConfigDict(from_attributes=True) and model_dump/model_validate (ideally showing the v1 to v2 mapping).",
   "covered": true,
   "result_ids": [
    "sqlalchemy2-pydantic-v2-from-attributes",
    "fastapi-pydantic-v2-models",
    "orjson-pydantic-v2-roundtrip",
    "pytest-hypothesis-pydantic-roundtrip",
    "jmespath-pydantic-filter",
    "pydantic-email-phone-validation",
    "deepdiff-pydantic-compare",
    "msgpack-pydantic-binary-roundtrip",
    "validator-js-sanitize",
    "pydantic-settings-yaml-secrets"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": "fastapi-pydantic-v2-models",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.1,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 69.0,
      "output_tokens": null,
      "output_chars": 2036,
      "total_tokens": 75953
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 71.2,
      "output_tokens": null,
      "output_chars": 1918,
      "total_tokens": 74735
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 85.1,
      "output_tokens": null,
      "output_chars": 1917,
      "total_tokens": 81477
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 43.6,
      "output_tokens": null,
      "output_chars": 1897,
      "total_tokens": 64670
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 59.4,
      "output_tokens": null,
      "output_chars": 1992,
      "total_tokens": 64223
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 40.1,
      "output_tokens": null,
      "output_chars": 1957,
      "total_tokens": 63438
     }
    ]
   },
   "latency_ms": 135,
   "notes": "#1 Pydantic v2 from_attributes on ORM rows and #2 field_validator/model_validator patterns (both 2.14.1) cover the v2 idioms; neither is framed as a v1->v2 migration (verify they use ConfigDict/model_dump)"
  },
  {
   "task_id": "T042",
   "language": "python",
   "libraries": [
    "sqlalchemy"
   ],
   "category": "version_gotcha",
   "query": "SQLAlchemy 1.4 to 2.0: replace session.query() with select() and use Mapped[] typed models",
   "search_args": {
    "query": "SQLAlchemy 1.4 to 2.0: replace session.query() with select() and use Mapped[] typed models"
   },
   "fitting_definition": "SQLAlchemy 2.x recipe using DeclarativeBase + Mapped/mapped_column and select() with session.scalars()/session.execute().",
   "covered": true,
   "result_ids": [
    "sqlmodel-sqlalchemy-core-select",
    "sqlalchemy-hybrid-events",
    "flask-migrate-sqlite",
    "sqlalchemy-factory-boy-sqlite",
    "sqlalchemy-async-aiosqlite",
    "pandas-sqlalchemy-to-sql",
    "fastapi-sqlalchemy-crud",
    "marshmallow-sqlalchemy-flask-api",
    "sqlalchemy-aiosqlite-session-factory",
    "sqlalchemy2-pydantic-v2-from-attributes"
   ],
   "top1_correct": false,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 6,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 1.9,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 131,
   "notes": "code: sqlalchemy-hybrid-events uses DeclarativeBase/Mapped/mapped_column with select()+session.scalars(); rank-4 factory-boy recipe not fetched, so not counted; top1 is SQLModel + Core select"
  },
  {
   "task_id": "T043",
   "language": "python",
   "libraries": [
    "httpx",
    "fastapi"
   ],
   "category": "version_gotcha",
   "query": "httpx 0.28 removed the app= argument: test a FastAPI ASGI app with AsyncClient and ASGITransport",
   "search_args": {
    "query": "httpx 0.28 removed the app= argument: test a FastAPI ASGI app with AsyncClient and ASGITransport"
   },
   "fitting_definition": "httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url=...) used to call a FastAPI app in-process (httpx >= 0.28).",
   "covered": true,
   "result_ids": [
    "fastapi-httpx-asyncclient-lifespan",
    "fastapi-dependency-overrides-httpx",
    "fastapi-async-sqlalchemy-aiosqlite-pytest",
    "starlette-httpx-asgi-client",
    "fastapi-cashews-memory-cache",
    "fastapi-prometheus-instrumentator",
    "prometheus-client-fastapi-metrics",
    "fastapi-dependency-injector-wiring",
    "fastapi-pydantic-settings-dependency",
    "fastapi-slowapi-rate-limit"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": "fastapi-httpx-asyncclient-lifespan",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 6,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.1,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 145.9,
      "output_tokens": null,
      "output_chars": 6170,
      "total_tokens": 81253
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 192.2,
      "output_tokens": null,
      "output_chars": 6776,
      "total_tokens": 86424
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 240.1,
      "output_tokens": null,
      "output_chars": 7635,
      "total_tokens": 97781
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 107.3,
      "output_tokens": null,
      "output_chars": 5907,
      "total_tokens": 70545
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 132.6,
      "output_tokens": null,
      "output_chars": 6711,
      "total_tokens": 73525
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 217.4,
      "output_tokens": null,
      "output_chars": 10015,
      "total_tokens": 83881
     }
    ]
   },
   "latency_ms": 142,
   "notes": "fastapi-httpx-asyncclient-lifespan, fastapi-dependency-overrides-httpx and the async SQLAlchemy recipe all drive FastAPI through httpx 0.28.1 ASGITransport"
  },
  {
   "task_id": "T044",
   "language": "python",
   "libraries": [
    "fastapi"
   ],
   "category": "version_gotcha",
   "query": "replace deprecated FastAPI @app.on_event startup and shutdown with a lifespan context manager",
   "search_args": {
    "query": "replace deprecated FastAPI @app.on_event startup and shutdown with a lifespan context manager"
   },
   "fitting_definition": "FastAPI app using lifespan= with an asynccontextmanager to set up and tear down resources (app.state or yielded state), with no on_event.",
   "covered": true,
   "result_ids": [
    "fastapi-httpx-asyncclient-lifespan",
    "fastapi-argon2-login",
    "fastapi-websocket-auth",
    "fastapi-stripe-webhook",
    "fastapi-dependency-injector-wiring",
    "fastapi-pydantic-settings-dependency",
    "fastapi-async-sqlalchemy-aiosqlite-pytest",
    "fastapi-cashews-memory-cache",
    "fastapi-prometheus-instrumentator",
    "prometheus-client-fastapi-metrics"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": "fastapi-httpx-asyncclient-lifespan",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 6,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.1,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 41.6,
      "output_tokens": null,
      "output_chars": 1188,
      "total_tokens": 70424
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 46.6,
      "output_tokens": null,
      "output_chars": 1346,
      "total_tokens": 70166
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 57.5,
      "output_tokens": null,
      "output_chars": 1287,
      "total_tokens": 71293
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 31.1,
      "output_tokens": null,
      "output_chars": 1596,
      "total_tokens": 63008
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 47.0,
      "output_tokens": null,
      "output_chars": 1447,
      "total_tokens": 63399
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 36.7,
      "output_tokens": null,
      "output_chars": 1418,
      "total_tokens": 62171
     }
    ]
   },
   "latency_ms": 161,
   "notes": "fastapi-httpx-asyncclient-lifespan opens a resource in a FastAPI lifespan handler; directly shows the lifespan pattern"
  },
  {
   "task_id": "T045",
   "language": "python",
   "libraries": [
    "pyjwt"
   ],
   "category": "version_gotcha",
   "query": "PyJWT 2 upgrade: jwt.decode now requires algorithms and jwt.encode returns str instead of bytes",
   "search_args": {
    "query": "PyJWT 2 upgrade: jwt.decode now requires algorithms and jwt.encode returns str instead of bytes"
   },
   "fitting_definition": "PyJWT 2.x encode/decode with an explicit algorithms list and exp/aud handling, without .decode('utf-8') on the token.",
   "covered": true,
   "result_ids": [
    "returns-maybe-ioresult",
    "fastapi-oauth2-pyjwt-scopes",
    "pyjwt-cryptography-rs256",
    "fastapi-jwt-auth",
    "pretty-bytes-format",
    "networkx-shortest-path-dag",
    "sqlalchemy-alembic-migrations",
    "pako-deflate-gzip",
    "pyarrow-parquet-roundtrip",
    "arktype-schema-validation"
   ],
   "top1_correct": false,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 6,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 0.9,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 174,
   "notes": "top1 is the returns library (Maybe/IOResult): the word returns in the query matched a library name. #2-#4 are PyJWT 2.15.1 recipes with explicit algorithms (pyjwt-cryptography-rs256 enforces algorithm)"
  },
  {
   "task_id": "T046",
   "language": "python",
   "libraries": [
    "openai"
   ],
   "category": "version_gotcha",
   "query": "openai.ChatCompletion.create is no longer supported: migrate openai python 0.28 code to the OpenAI client",
   "search_args": {
    "query": "openai.ChatCompletion.create is no longer supported: migrate openai python 0.28 code to the OpenAI client"
   },
   "fitting_definition": "Recipe using the OpenAI() client with client.chat.completions.create or client.responses.create (openai >= 1.0).",
   "covered": true,
   "result_ids": [
    "openai-python-respx-mock",
    "openai-sdk-mocked-tool-calls",
    "openai-streaming-mock",
    "openai-structured-output-respx",
    "flask-migrate-sqlite",
    "python-multipart-starlette-forms",
    "httpx-pydantic-typed-client",
    "python-box-dot-access-config",
    "python-slugify-unidecode-titles",
    "python-docx-table-report"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.2,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 147,
   "notes": "openai-python-respx-mock and openai-structured-output-respx use the openai 3.31.0 OpenAI() client, which shows the post-0.28 API; #2/#3 in s1 are TypeScript"
  },
  {
   "task_id": "T047",
   "language": "python",
   "libraries": [
    "pytest-asyncio",
    "pytest"
   ],
   "category": "version_gotcha",
   "query": "pytest-asyncio 1.0 removed the event_loop fixture: how to set asyncio mode and loop scope for async fixtures",
   "search_args": {
    "query": "pytest-asyncio 1.0 removed the event_loop fixture: how to set asyncio mode and loop scope for async fixtures"
   },
   "fitting_definition": "pytest-asyncio >= 1.0 configuration (asyncio_mode, asyncio_default_fixture_loop_scope or loop_scope markers) with async fixtures and tests, and no event_loop fixture override.",
   "covered": true,
   "result_ids": [
    "pytest-asyncio-taskgroup-timeouts",
    "sqlalchemy-async-aiosqlite",
    "anyio-to-thread-bridge",
    "aiofiles-anyio-temp-io",
    "fastapi-async-sqlalchemy-aiosqlite-pytest",
    "sqlalchemy-aiosqlite-session-factory",
    "sqlalchemy-async-repository-pattern",
    "aiohttp-pytest-plugin-client",
    "pytest-factory-boy-sqlalchemy",
    "tortoise-orm-sqlite-relations"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 5,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 1.0,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 144,
   "notes": "recipes pinned to pytest-asyncio 1.4.0 with async tests and fixtures (TaskGroup timeouts, async SQLAlchemy, anyio); should show 1.x configuration without event_loop (verify). stack [pytest-asyncio,pytest] returns 0"
  },
  {
   "task_id": "T048",
   "language": "python",
   "libraries": [
    "pandas"
   ],
   "category": "version_gotcha",
   "query": "pandas 3.0 copy-on-write: chained assignment no longer updates the DataFrame, and the new default string dtype",
   "search_args": {
    "query": "pandas 3.0 copy-on-write: chained assignment no longer updates the DataFrame, and the new default string dtype"
   },
   "fitting_definition": "pandas 3.x recipe showing copy-on-write-safe modification (single-step .loc assignment) and/or handling of the default str dtype.",
   "covered": false,
   "result_ids": [
    "pandas-sqlalchemy-to-sql",
    "pandas-openpyxl-excel-report",
    "pandas-pandera-validation",
    "sklearn-columntransformer-pipeline",
    "pandas-pyarrow-parquet-roundtrip",
    "rapidfuzz-fuzzy-match",
    "string-width-strip-ansi",
    "fs-extra-json-copy",
    "magic-string-sourcemap-edits",
    "preact-render-to-string-ssr"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": "none",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 6,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.4,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 120.6,
      "output_tokens": null,
      "output_chars": 3860,
      "total_tokens": 80052
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 97.7,
      "output_tokens": null,
      "output_chars": 3021,
      "total_tokens": 74389
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 137.2,
      "output_tokens": null,
      "output_chars": 3161,
      "total_tokens": 79169
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 88.3,
      "output_tokens": null,
      "output_chars": 2917,
      "total_tokens": 68698
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 110.5,
      "output_tokens": null,
      "output_chars": 3637,
      "total_tokens": 70884
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 113.5,
      "output_tokens": null,
      "output_chars": 2575,
      "total_tokens": 70929
     }
    ]
   },
   "latency_ms": 167,
   "notes": "results are pandas 3.0.6 recipes on other topics (SQL, Excel, pandera, sklearn); none covers copy-on-write or the str dtype"
  },
  {
   "task_id": "T049",
   "language": "python",
   "libraries": [
    "marshmallow"
   ],
   "category": "version_gotcha",
   "query": "marshmallow 4 upgrade: missing= and default= removed, use load_default and dump_default, and Schema.context removed",
   "search_args": {
    "query": "marshmallow 4 upgrade: missing= and default= removed, use load_default and dump_default, and Schema.context removed"
   },
   "fitting_definition": "marshmallow 4.x recipe using load_default/dump_default and no Schema.context (contextvars-based Context or explicit arguments instead).",
   "covered": true,
   "result_ids": [
    "marshmallow-dataclass-schema",
    "flask-marshmallow-webargs",
    "marshmallow-sqlalchemy-flask-api",
    "marshmallow-oneofschema-polymorphic",
    "tomlkit-comment-preserve",
    "semver-range-checks",
    "zod-env-dotenv-config",
    "cosmiconfig-fixture-load",
    "fastify-zod-type-provider",
    "protobufjs-proto-encode"
   ],
   "top1_correct": false,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 6,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 1.1,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 137,
   "notes": "code: flask-marshmallow-webargs (rank 2) uses fields.*(load_default=...) on marshmallow 4.3.1 and no Schema.context; top1 marshmallow-dataclass-schema shows neither"
  },
  {
   "task_id": "T050",
   "language": "python",
   "libraries": [
    "numpy"
   ],
   "category": "version_gotcha",
   "query": "NumPy 2.0 removed np.float_, np.NaN and np.Inf: fix AttributeError after upgrading",
   "search_args": {
    "query": "NumPy 2.0 removed np.float_, np.NaN and np.Inf: fix AttributeError after upgrading"
   },
   "fitting_definition": "Recipe on NumPy 2.x using np.float64/np.nan/np.inf (ideally noting the removed aliases).",
   "covered": false,
   "result_ids": [
    "numpy-scipy-optimize-fit",
    "sqlalchemy-hybrid-events",
    "tenacity-retry-stop-wait",
    "ftfy-mojibake-fix",
    "tenacity-httpx-respx-backoff",
    "pandas-sqlalchemy-to-sql",
    "sklearn-columntransformer-pipeline",
    "pydantic-annotated-after-validator",
    "peewee-playhouse-sqlite-json",
    "jsdiff-patch-apply"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 6,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.9,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 132,
   "notes": "top1 numpy-scipy-optimize-fit pins numpy 2.5.4 but is a curve-fitting recipe; nothing about the removed np.float_/np.NaN/np.Inf aliases"
  },
  {
   "task_id": "T051",
   "language": "typescript",
   "libraries": [
    "zod"
   ],
   "category": "version_gotcha",
   "query": "zod v3 to v4 migration: z.string().email() deprecated, message param renamed to error, error.flatten() and format() replaced, z.record needs a key schema",
   "search_args": {
    "query": "zod v3 to v4 migration: z.string().email() deprecated, message param renamed to error, error.flatten() and format() replaced, z.record needs a key schema"
   },
   "fitting_definition": "zod 4.x recipe using top-level format schemas (z.email()), the error param for custom messages, and z.treeifyError/z.flattenError or z.prettifyError.",
   "covered": true,
   "result_ids": [
    "zod-v4-json-schema-export",
    "ws-zod-message-protocol",
    "zod-to-openapi-document-generation",
    "koa-router-zod-supertest",
    "nestjs-zod-validation-pipe",
    "gray-matter-zod-frontmatter",
    "langchainjs-zod-tools",
    "croner-zod-job-scheduler",
    "better-sqlite3-zod-transactions",
    "react-hook-form-zod-resolver"
   ],
   "top1_correct": false,
   "top3_correct": false,
   "uncovered_outcome": null,
   "recipe_id_used": "none",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.2,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 146.4,
      "output_tokens": null,
      "output_chars": 1806,
      "total_tokens": 83670
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 271.4,
      "output_tokens": null,
      "output_chars": 1763,
      "total_tokens": 100048
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 295.9,
      "output_tokens": null,
      "output_chars": 2039,
      "total_tokens": 101762
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 267.6,
      "output_tokens": null,
      "output_chars": 2000,
      "total_tokens": 89420
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 243.2,
      "output_tokens": null,
      "output_chars": 1957,
      "total_tokens": 87066
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 223.9,
      "output_tokens": null,
      "output_chars": 1969,
      "total_tokens": 85000
     }
    ]
   },
   "latency_ms": 136,
   "notes": "code: nestjs-zod-validation-pipe (rank 5) and express-zod-validation (not in top 10) use z.email() and z.flattenError (2 of the 3 named zod 4 changes); no zod recipe uses the error param; top1 zod-v4-json-schema-export has only z.email()"
  },
  {
   "task_id": "T052",
   "language": "typescript",
   "libraries": [
    "express"
   ],
   "category": "version_gotcha",
   "query": "Express 5 migration: wildcard routes need names like /*splat and rejected promises in async handlers go to the error handler",
   "search_args": {
    "query": "Express 5 migration: wildcard routes need names like /*splat and rejected promises in async handlers go to the error handler"
   },
   "fitting_definition": "Express 5.x recipe with v5 path syntax (named wildcards, braces for optional segments) and/or async handler errors reaching error middleware without wrappers.",
   "covered": true,
   "result_ids": [
    "express5-async-error-handling",
    "joi-express-validation",
    "http-errors-express-error-middleware",
    "twilio-webhook-signature-express",
    "passport-local-express-session",
    "express-passport-jwt",
    "cors-express-preflight",
    "express-stripe-webhook",
    "express-openapi-validator-spec",
    "express-helmet-rate-limit"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": "express5-async-error-handling",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.8,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 74.5,
      "output_tokens": null,
      "output_chars": 2424,
      "total_tokens": 74748
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 74.8,
      "output_tokens": null,
      "output_chars": 2253,
      "total_tokens": 72047
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 65.4,
      "output_tokens": null,
      "output_chars": 2535,
      "total_tokens": 71294
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 86.9,
      "output_tokens": null,
      "output_chars": 2854,
      "total_tokens": 68070
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 59.0,
      "output_tokens": null,
      "output_chars": 2475,
      "total_tokens": 65277
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 38.2,
      "output_tokens": null,
      "output_chars": 2145,
      "total_tokens": 62895
     }
    ]
   },
   "latency_ms": 155,
   "notes": "express5-async-error-handling shows Express 5 forwarding rejected async handlers to error middleware (the definition accepts either gotcha); nothing about named wildcards"
  },
  {
   "task_id": "T053",
   "language": "typescript",
   "libraries": [
    "eslint",
    "typescript-eslint"
   ],
   "category": "version_gotcha",
   "query": "migrate .eslintrc.json to eslint.config.js flat config with typescript-eslint",
   "search_args": {
    "query": "migrate .eslintrc.json to eslint.config.js flat config with typescript-eslint"
   },
   "fitting_definition": "ESLint flat config (eslint.config.js/.mjs) using typescript-eslint's config helper and recommended configs, for ESLint >= 9.",
   "covered": false,
   "result_ids": [
    "json-schema-to-typescript-codegen",
    "flask-migrate-sqlite",
    "openapi-typescript-generate-types",
    "js-yaml-zod-config",
    "pyyaml-jsonschema-config",
    "voluptuous-config-schema-coerce",
    "platformdirs-toml-config-store",
    "cosmiconfig-fixture-load",
    "glom-nested-transform",
    "pydantic-settings-config"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 4.5,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 218,
   "notes": "top1 json-schema-to-typescript codegen; #2 is a Python Flask-Migrate recipe for a TypeScript ESLint query; nothing about ESLint flat config; stack filter returns 0"
  },
  {
   "task_id": "T054",
   "language": "typescript",
   "libraries": [
    "next"
   ],
   "category": "version_gotcha",
   "query": "Next.js 15 async request APIs: await params, cookies() and headers() in app router pages and route handlers",
   "search_args": {
    "query": "Next.js 15 async request APIs: await params, cookies() and headers() in app router pages and route handlers"
   },
   "fitting_definition": "Next.js >= 15 app router code using await params, await cookies() and await headers().",
   "covered": false,
   "result_ids": [
    "nextjs-stripe-webhook",
    "nextjs-route-handler-zod",
    "nextjs-supabase-auth-middleware",
    "nextjs-server-action-zod",
    "nextauth-credentials-callbacks",
    "set-cookie-parser-split",
    "react-router-loader-action",
    "graphql-request-msw",
    "express5-async-error-handling",
    "starlette-itsdangerous-sessions"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 14.3,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 131,
   "notes": "results are Next.js 16.4.1 recipes on other topics (Stripe webhook, Zod route handler, Supabase middleware, server actions); none is about await params/cookies()/headers()"
  },
  {
   "task_id": "T055",
   "language": "typescript",
   "libraries": [
    "fastify"
   ],
   "category": "version_gotcha",
   "query": "Fastify v4 to v5 migration: full JSON schema required for querystring and params, reply.redirect argument order changed, listen needs an options object",
   "search_args": {
    "query": "Fastify v4 to v5 migration: full JSON schema required for querystring and params, reply.redirect argument order changed, listen needs an options object"
   },
   "fitting_definition": "Fastify 5.x recipe with full JSON Schema objects for querystring/params, reply.redirect(url, code) and listen({ port }).",
   "covered": false,
   "result_ids": [
    "fastify-swagger-openapi",
    "fastify-json-schema",
    "fastify-zod-type-provider",
    "fastify-jwt-auth",
    "fastify-multipart-upload",
    "json-schema-to-typescript-codegen",
    "zod-v4-json-schema-export",
    "ajv-formats-json-schema",
    "orama-fulltext-search",
    "voluptuous-config-schema-coerce"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": "none",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 4.0,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 29.2,
      "output_tokens": null,
      "output_chars": 1557,
      "total_tokens": 68721
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 59.2,
      "output_tokens": null,
      "output_chars": 1453,
      "total_tokens": 71200
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 53.6,
      "output_tokens": null,
      "output_chars": 1482,
      "total_tokens": 68787
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 24.2,
      "output_tokens": null,
      "output_chars": 1540,
      "total_tokens": 62109
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 21.0,
      "output_tokens": null,
      "output_chars": 1525,
      "total_tokens": 61616
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 32.5,
      "output_tokens": null,
      "output_chars": 1633,
      "total_tokens": 62389
     }
    ]
   },
   "latency_ms": 236,
   "notes": "results are Fastify 5.12.7 recipes (swagger, JSON schema validation, zod provider, jwt); #2 shows full JSON Schema validation but none covers the v4->v5 redirect argument order or listen options"
  },
  {
   "task_id": "T056",
   "language": "typescript",
   "libraries": [
    "typeorm"
   ],
   "category": "version_gotcha",
   "query": "TypeORM createConnection and getRepository removed: migrate to DataSource",
   "search_args": {
    "query": "TypeORM createConnection and getRepository removed: migrate to DataSource"
   },
   "fitting_definition": "TypeORM >= 0.3 recipe using new DataSource({...}).initialize() and dataSource.getRepository(Entity).",
   "covered": false,
   "result_ids": [
    "nestjs-typeorm-sqlite",
    "flask-migrate-sqlite",
    "json-schema-to-typescript-codegen",
    "preact-render-to-string-ssr",
    "zod-to-openapi-document-generation",
    "jsdiff-patch-apply",
    "jscodeshift-transform-test",
    "pandas-openpyxl-excel-report",
    "pyarrow-parquet-roundtrip",
    "sqlmodel-relationships-sqlite"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 2,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 10.8,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 131,
   "notes": "top1 nestjs-typeorm-sqlite pins typeorm 1.1.2 but goes through @nestjs/typeorm, not new DataSource().initialize()/getRepository directly"
  },
  {
   "task_id": "T057",
   "language": "typescript",
   "libraries": [
    "tailwindcss",
    "@tailwindcss/postcss"
   ],
   "category": "version_gotcha",
   "query": "Tailwind CSS v4 upgrade: tailwind.config.js theme to @theme in CSS, @tailwind directives to @import, postcss plugin moved",
   "search_args": {
    "query": "Tailwind CSS v4 upgrade: tailwind.config.js theme to @theme in CSS, @tailwind directives to @import, postcss plugin moved"
   },
   "fitting_definition": "Tailwind 4.x setup with @import \"tailwindcss\", @theme tokens in CSS and the @tailwindcss/postcss or @tailwindcss/vite plugin.",
   "covered": false,
   "result_ids": [
    "postcss-custom-plugin-autoprefixer",
    "clsx-tailwind-merge-cva",
    "beautifulsoup4-soupsieve-select",
    "markdown-it-render-plugin",
    "openpyxl-pydantic-row-import",
    "exceljs-read-write",
    "papaparse-zod-csv-import",
    "zod-v4-json-schema-export",
    "node-html-parser-query",
    "sass-compile-string-importer"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.3,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 131,
   "notes": "no Tailwind recipe (stack filter 0); top1 is a custom PostCSS plugin + autoprefixer; #2 clsx/tailwind-merge class helpers"
  },
  {
   "task_id": "T058",
   "language": "typescript",
   "libraries": [
    "react",
    "react-dom"
   ],
   "category": "version_gotcha",
   "query": "React 19 upgrade: ReactDOM.render removed, forwardRef no longer needed, useFormState renamed to useActionState",
   "search_args": {
    "query": "React 19 upgrade: ReactDOM.render removed, forwardRef no longer needed, useFormState renamed to useActionState"
   },
   "fitting_definition": "React 19 code using createRoot, ref as a regular prop and useActionState.",
   "covered": false,
   "result_ids": [
    "jotai-atoms-react-testing-library",
    "react-hook-form-zod-resolver",
    "react-email-render-html-text",
    "i18next-react-ssr",
    "react-query-testing-library",
    "react-router-loader-action",
    "mdx-compile-evaluate",
    "nextjs-server-action-zod",
    "ink-testing-library-cli",
    "nextjs-route-handler-zod"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 5,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 8.0,
    "error": "npm 10.9.4 crashed in npm install (edgesOut); passed when the same setup ran through npx npm@11.6.0, as ProvenPin's runner does",
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 158,
   "notes": "results are React 19.3.1-pinned recipes on other topics (jotai, react-hook-form, react-email, i18next, mdx); none covers createRoot, ref as prop or useActionState"
  },
  {
   "task_id": "T059",
   "language": "typescript",
   "libraries": [
    "drizzle-kit",
    "drizzle-orm"
   ],
   "category": "version_gotcha",
   "query": "drizzle-kit config changed: driver replaced by dialect and generate:sqlite replaced by generate",
   "search_args": {
    "query": "drizzle-kit config changed: driver replaced by dialect and generate:sqlite replaced by generate"
   },
   "fitting_definition": "drizzle.config.ts using defineConfig({ dialect, schema, out, dbCredentials }) with drizzle-kit >= 0.21 commands (generate/migrate).",
   "covered": false,
   "result_ids": [
    "drizzle-sqlite-crud",
    "drizzle-zod-insert-schemas",
    "hono-drizzle-sqlite-api",
    "authjs-drizzle-adapter-pglite",
    "drizzle-pglite-migrations",
    "drizzle-pglite-postgres",
    "prisma-sqlite-adapter",
    "sqlalchemy-alembic-autogenerate-check",
    "prisma-sqlite-transactions",
    "tortoise-orm-sqlite-relations"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 1,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 9.5,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 157,
   "notes": "no drizzle-kit config recipe (stack filter 0); top1 drizzle-sqlite-crud is migrations-free"
  },
  {
   "task_id": "T060",
   "language": "typescript",
   "libraries": [
    "openai"
   ],
   "category": "version_gotcha",
   "query": "openai node v3 Configuration and OpenAIApi are not constructors: migrate to the new OpenAI client",
   "search_args": {
    "query": "openai node v3 Configuration and OpenAIApi are not constructors: migrate to the new OpenAI client"
   },
   "fitting_definition": "openai Node SDK >= 4 code using new OpenAI() and client.chat.completions.create or client.responses.create.",
   "covered": true,
   "result_ids": [
    "openai-streaming-mock",
    "openai-sdk-mocked-tool-calls",
    "openai-python-respx-mock",
    "openai-structured-output-respx",
    "flask-migrate-sqlite",
    "aws-sdk-v3-dynamodb-sqs-vitest",
    "aws-sdk-v3-s3-client-mock",
    "ky-msw-vitest",
    "urql-core-msw-cache-exchange",
    "msw-fetch-api-client"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": "none",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 2,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 4.2,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 50.5,
      "output_tokens": null,
      "output_chars": 2267,
      "total_tokens": 68709
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 67.8,
      "output_tokens": null,
      "output_chars": 2303,
      "total_tokens": 74814
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 46.9,
      "output_tokens": null,
      "output_chars": 2201,
      "total_tokens": 70235
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 37.2,
      "output_tokens": null,
      "output_chars": 1846,
      "total_tokens": 62616
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 53.2,
      "output_tokens": null,
      "output_chars": 2709,
      "total_tokens": 64808
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 28.6,
      "output_tokens": null,
      "output_chars": 1661,
      "total_tokens": 62493
     }
    ]
   },
   "latency_ms": 165,
   "notes": "openai-streaming-mock and openai-sdk-mocked-tool-calls use the current Node SDK (pinned 7.34.0) with chat completions; enough to show the new client shape"
  },
  {
   "task_id": "T061",
   "language": "python",
   "libraries": [
    "fastapi",
    "pydantic",
    "sqlalchemy"
   ],
   "category": "messy_question",
   "query": "fastapi returning sqlalchemy object gives 'Input should be a valid dictionary' error, orm_mode doesnt work anymore??",
   "search_args": {
    "query": "fastapi returning sqlalchemy object gives 'Input should be a valid dictionary' error, orm_mode doesnt work anymore??"
   },
   "fitting_definition": "FastAPI + SQLAlchemy recipe whose Pydantic v2 response models use from_attributes=True (ConfigDict) to serialize ORM objects.",
   "covered": true,
   "result_ids": [
    "fastapi-sqlalchemy-crud",
    "fastapi-async-sqlalchemy-aiosqlite-pytest",
    "sqlalchemy-async-aiosqlite",
    "sqlalchemy2-pydantic-v2-from-attributes",
    "flask-sqlalchemy-app-factory",
    "sqlalchemy-async-repository-pattern",
    "sqlalchemy-factory-boy-sqlite",
    "sqlalchemy-hybrid-events",
    "pytest-factory-boy-sqlalchemy",
    "sqlalchemy-aiosqlite-session-factory"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 2,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.3,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 133,
   "notes": "top1 fastapi-sqlalchemy-crud (FastAPI + SQLAlchemy 2 + pydantic 2.14.1 pinned) should serialize ORM rows via from_attributes; summary does not say so explicitly, verify in code. #4 is explicitly from_attributes but has no FastAPI. s3 stack [fastapi,pydantic] drops it because the recipe stack omits pydantic"
  },
  {
   "task_id": "T062",
   "language": "python",
   "libraries": [
    "celery",
    "redis"
   ],
   "category": "messy_question",
   "query": "celery task just hangs forever no error, redis broker... also how do i retry when the external api is down",
   "search_args": {
    "query": "celery task just hangs forever no error, redis broker... also how do i retry when the external api is down"
   },
   "fitting_definition": "Celery + Redis recipe with retries (autoretry_for/self.retry with backoff) and time limits or acks/visibility configuration.",
   "covered": false,
   "result_ids": [
    "celery-redis-fakeredis-results",
    "django-celery-eager-signals",
    "celery-tasks-eager-testing",
    "redis-fakeredis-pipeline",
    "celery-beat-schedule-crontab",
    "result-ok-err-map",
    "rq-fakeredis-jobs",
    "boltons-funcutils-retry",
    "lark-lalr-calculator-transformer",
    "elysia-typebox-handle-tests"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 1.8,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 137,
   "notes": "top1 celery-redis-fakeredis-results configures Celery on Redis but shows an idempotency lock, not retries/backoff or time limits/visibility settings for hanging tasks"
  },
  {
   "task_id": "T063",
   "language": "python",
   "libraries": [
    "sqlalchemy",
    "fastapi"
   ],
   "category": "messy_question",
   "query": "sqlalchemy DetachedInstanceError after session commit in my fastapi endpoint help",
   "search_args": {
    "query": "sqlalchemy DetachedInstanceError after session commit in my fastapi endpoint help"
   },
   "fitting_definition": "FastAPI + SQLAlchemy recipe with a per-request session dependency and expire_on_commit=False or refresh after commit.",
   "covered": true,
   "result_ids": [
    "fastapi-async-sqlalchemy-aiosqlite-pytest",
    "fastapi-sqlalchemy-crud",
    "sqlalchemy-aiosqlite-session-factory",
    "sqlalchemy-factory-boy-sqlite",
    "pydantic-v2-discriminated-unions-fastapi",
    "fastapi-websocket-auth",
    "flask-migrate-sqlite",
    "sqlmodel-fastapi-crud",
    "fastapi-cashews-memory-cache",
    "flask-sqlalchemy-app-factory"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.7,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 129,
   "notes": "FastAPI + SQLAlchemy 2 recipes with a per-request session dependency; whether they set expire_on_commit=False or refresh after commit is not in the summary (verify)"
  },
  {
   "task_id": "T064",
   "language": "python",
   "libraries": [
    "pytest",
    "pytest-asyncio"
   ],
   "category": "messy_question",
   "query": "pytest async test says coroutine was never awaited and my async fixture isnt running whats wrong",
   "search_args": {
    "query": "pytest async test says coroutine was never awaited and my async fixture isnt running whats wrong"
   },
   "fitting_definition": "pytest-asyncio recipe showing a configured asyncio mode or markers with async fixtures and async tests.",
   "covered": true,
   "result_ids": [
    "fastapi-async-sqlalchemy-aiosqlite-pytest",
    "quart-httpx-asgi-client",
    "aiofiles-anyio-temp-io",
    "sqlalchemy-async-aiosqlite",
    "anyio-to-thread-bridge",
    "aiohttp-pytest-plugin-client",
    "fastapi-dependency-overrides-httpx",
    "loguru-pytest-caplog",
    "sqlalchemy-aiosqlite-session-factory",
    "sqlalchemy-async-repository-pattern"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.7,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 153,
   "notes": "recipes pinned to pytest-asyncio 1.4.0 with async tests/fixtures (FastAPI async SQLAlchemy, aiofiles+anyio, async SQLAlchemy fixtures) should show a working asyncio mode setup (verify); none is framed as the fix for never-awaited coroutines. stack [pytest,pytest-asyncio] returns 0 although these recipes list pytest-asyncio"
  },
  {
   "task_id": "T065",
   "language": "python",
   "libraries": [
    "pandas",
    "polars"
   ],
   "category": "messy_question",
   "query": "pandas SettingWithCopyWarning everywhere, how to stop it & also make it faster maybe polars?",
   "search_args": {
    "query": "pandas SettingWithCopyWarning everywhere, how to stop it & also make it faster maybe polars?"
   },
   "fitting_definition": "Recipe showing correct pandas assignment (.loc / explicit copy / copy-on-write) and/or the equivalent Polars transformation (pandas and polars side by side).",
   "covered": false,
   "result_ids": [
    "pandas-openpyxl-excel-report",
    "duckdb-polars-analytics",
    "polars-pandera-validation",
    "polars-pydantic-row-validation",
    "pandas-pandera-validation",
    "sklearn-columntransformer-pipeline",
    "pandas-sqlalchemy-to-sql",
    "pandas-pyarrow-parquet-roundtrip",
    "returns-maybe-ioresult",
    "octokit-rest-msw-pagination"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": "none",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.2,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 82.2,
      "output_tokens": null,
      "output_chars": 2943,
      "total_tokens": 73710
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 88.3,
      "output_tokens": null,
      "output_chars": 2729,
      "total_tokens": 74266
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 124.1,
      "output_tokens": null,
      "output_chars": 2728,
      "total_tokens": 77555
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 104.3,
      "output_tokens": null,
      "output_chars": 4200,
      "total_tokens": 70840
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 87.3,
      "output_tokens": null,
      "output_chars": 3301,
      "total_tokens": 68254
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 70.7,
      "output_tokens": null,
      "output_chars": 3157,
      "total_tokens": 66872
     }
    ]
   },
   "latency_ms": 248,
   "notes": "top1 is a pandas-to-Excel report; no result covers SettingWithCopy / copy-on-write assignment or pandas-vs-polars; stack [pandas,polars] returns 0"
  },
  {
   "task_id": "T066",
   "language": "python",
   "libraries": [
    "boto3"
   ],
   "category": "messy_question",
   "query": "upload big csv to s3 in chunks python without loading whole file into memory",
   "search_args": {
    "query": "upload big csv to s3 in chunks python without loading whole file into memory"
   },
   "fitting_definition": "boto3 multipart upload (upload_fileobj with TransferConfig, or create_multipart_upload/upload_part) streaming from a file.",
   "covered": false,
   "result_ids": [
    "csv-parse-stringify-streams",
    "python-multipart-starlette-forms",
    "aws-sdk-v3-s3-client-mock",
    "papaparse-zod-csv-import",
    "boto3-moto-s3-presigned",
    "fastify-multipart-upload",
    "file-type-buffer-detect",
    "typer-rich-table-export",
    "python-dotenv-pydantic-settings-env",
    "sheetjs-xlsx-workbook"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.7,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 132,
   "notes": "s1 top1 is TypeScript csv-parse streaming (same memory concern, wrong language, no S3); s2 boto3-moto-s3-presigned does uploads/listing/presign but no multipart or streaming upload"
  },
  {
   "task_id": "T067",
   "language": "python",
   "libraries": [
    "pyyaml",
    "pydantic-settings",
    "pydantic"
   ],
   "category": "messy_question",
   "query": "how parse yaml config file + validate with pydantic and let env vars override values??",
   "search_args": {
    "query": "how parse yaml config file + validate with pydantic and let env vars override values??"
   },
   "fitting_definition": "pydantic-settings recipe with a YAML source (YamlConfigSettingsSource or settings_customise_sources) where environment variables take precedence.",
   "covered": true,
   "result_ids": [
    "pydantic-settings-config",
    "pydantic-settings-yaml-secrets",
    "js-yaml-zod-config",
    "zod-to-openapi-document-generation",
    "python-dotenv-pydantic-settings-env",
    "orjson-pydantic-v2-roundtrip",
    "fastapi-pydantic-v2-models",
    "beartype-pydantic-runtime-check",
    "zod-env-dotenv-config",
    "pydantic-settings-nested-sources"
   ],
   "top1_correct": false,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": "pydantic-settings-yaml-secrets",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 1.1,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 64.2,
      "output_tokens": null,
      "output_chars": 2676,
      "total_tokens": 69393
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 100.6,
      "output_tokens": null,
      "output_chars": 3597,
      "total_tokens": 72972
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 131.3,
      "output_tokens": null,
      "output_chars": 2678,
      "total_tokens": 77077
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 71.3,
      "output_tokens": null,
      "output_chars": 3530,
      "total_tokens": 67355
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 66.0,
      "output_tokens": null,
      "output_chars": 2952,
      "total_tokens": 66597
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 119.4,
      "output_tokens": null,
      "output_chars": 4024,
      "total_tokens": 72830
     }
    ]
   },
   "latency_ms": 167,
   "notes": "#2 pydantic-settings-yaml-secrets loads YAML+env with env above YAML (fits); top1 pydantic-settings-config covers env/.env but no YAML"
  },
  {
   "task_id": "T068",
   "language": "python",
   "libraries": [
    "structlog",
    "fastapi",
    "uvicorn"
   ],
   "category": "messy_question",
   "query": "logging json for fastapi w request id in every line, uvicorn access logs too pls",
   "search_args": {
    "query": "logging json for fastapi w request id in every line, uvicorn access logs too pls"
   },
   "fitting_definition": "JSON logging (structlog or stdlib) with request-id middleware and uvicorn's loggers routed through the same JSON formatter.",
   "covered": false,
   "result_ids": [
    "structlog-fastapi-request-id",
    "fastapi-jinja2-htmx-partials",
    "fastapi-async-sqlalchemy-aiosqlite-pytest",
    "fastapi-stripe-webhook",
    "fastapi-pydantic-background-tasks",
    "fastapi-sqlalchemy-crud",
    "fastapi-cashews-memory-cache",
    "sqlmodel-fastapi-crud",
    "fastapi-argon2-login",
    "fastapi-dependency-injector-wiring"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 5,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 1.8,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 181,
   "notes": "top1 structlog-fastapi-request-id covers JSON logs with a request id but nothing about routing uvicorn access logs through the same formatter"
  },
  {
   "task_id": "T069",
   "language": "python",
   "libraries": [
    "httpx",
    "fastapi",
    "pytest"
   ],
   "category": "messy_question",
   "query": "TypeError AsyncClient.__init__() got an unexpected keyword argument 'app' in my fastapi tests",
   "search_args": {
    "query": "TypeError AsyncClient.__init__() got an unexpected keyword argument 'app' in my fastapi tests"
   },
   "fitting_definition": "Test recipe using httpx.ASGITransport(app=app) with AsyncClient to test a FastAPI app on httpx >= 0.28.",
   "covered": true,
   "result_ids": [
    "fastapi-httpx-asyncclient-lifespan",
    "fastapi-async-sqlalchemy-aiosqlite-pytest",
    "fastapi-dependency-overrides-httpx",
    "fastapi-pydantic-background-tasks",
    "fastapi-argon2-login",
    "fastapi-prometheus-instrumentator",
    "prometheus-client-fastapi-metrics",
    "structlog-fastapi-request-id",
    "fastapi-cashews-memory-cache",
    "fastapi-sqlalchemy-crud"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 6,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.1,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 239,
   "notes": "fastapi-httpx-asyncclient-lifespan, the async SQLAlchemy recipe and dependency-overrides recipe drive FastAPI through httpx 0.28.1 ASGITransport, the fix for the app= TypeError"
  },
  {
   "task_id": "T070",
   "language": "python",
   "libraries": [
    "fastapi",
    "pyjwt"
   ],
   "category": "messy_question",
   "query": "jwt token expired error handling + refresh token flow in fastapi pls, getting 500 instead of 401",
   "search_args": {
    "query": "jwt token expired error handling + refresh token flow in fastapi pls, getting 500 instead of 401"
   },
   "fitting_definition": "FastAPI + PyJWT recipe with access and refresh tokens, catching ExpiredSignatureError/InvalidTokenError and returning 401, plus a refresh endpoint.",
   "covered": false,
   "result_ids": [
    "fastapi-jwt-auth",
    "fastapi-websocket-auth",
    "fastapi-oauth2-pyjwt-scopes",
    "flask-jwt-extended-auth",
    "fastapi-pydantic-background-tasks",
    "fastapi-pydantic-v2-models",
    "fastapi-stripe-webhook",
    "fastapi-async-sqlalchemy-aiosqlite-pytest",
    "fastapi-sqlalchemy-crud",
    "sqlmodel-fastapi-crud"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": "fastapi-jwt-auth",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 2,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.5,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 87.0,
      "output_tokens": null,
      "output_chars": 4709,
      "total_tokens": 71221
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 86.0,
      "output_tokens": null,
      "output_chars": 4857,
      "total_tokens": 71746
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 103.5,
      "output_tokens": null,
      "output_chars": 7284,
      "total_tokens": 73383
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 116.5,
      "output_tokens": null,
      "output_chars": 6691,
      "total_tokens": 71368
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 117.9,
      "output_tokens": null,
      "output_chars": 5749,
      "total_tokens": 72180
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 90.5,
      "output_tokens": null,
      "output_chars": 5348,
      "total_tokens": 69214
     }
    ]
   },
   "latency_ms": 174,
   "notes": "top1 fastapi-jwt-auth is FastAPI+PyJWT bearer auth but its summary has no refresh tokens or expired-token 401 handling; the only refresh-token recipe shown is Flask"
  },
  {
   "task_id": "T071",
   "language": "typescript",
   "libraries": [
    "jsonwebtoken",
    "express"
   ],
   "category": "messy_question",
   "query": "jwt verify keeps saying invalid signature in node even tho secret is right, also how do refresh tokens",
   "search_args": {
    "query": "jwt verify keeps saying invalid signature in node even tho secret is right, also how do refresh tokens"
   },
   "fitting_definition": "Express + JWT (jsonwebtoken or jose) recipe with a consistent sign/verify algorithm and secret, plus refresh tokens.",
   "covered": false,
   "result_ids": [
    "flask-jwt-extended-auth",
    "fastify-jwt-auth",
    "express-passport-jwt",
    "nestjs-jwt-guard-testing",
    "bcryptjs-jose-sessions",
    "drf-simplejwt-auth",
    "svix-webhook-verify-hono",
    "jose-jwks-verify",
    "joserfc-jwt-jwe-roundtrip",
    "hono-jwt-auth"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 1.3,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 167,
   "notes": "s1 top1 is a Python Flask-JWT-Extended refresh-token recipe (same topic, wrong language) for a Node query; Express+jsonwebtoken recipes exist (passport-jwt, express-jwt-auth) but none shows refresh tokens"
  },
  {
   "task_id": "T072",
   "language": "typescript",
   "libraries": [
    "axios",
    "axios-retry",
    "bottleneck"
   ],
   "category": "messy_question",
   "query": "axios retry 3 times w backoff but only on 503 and dont go over api limit of 10 req/sec",
   "search_args": {
    "query": "axios retry 3 times w backoff but only on 503 and dont go over api limit of 10 req/sec"
   },
   "fitting_definition": "axios with retries limited to 503 (axios-retry retryCondition or an interceptor) plus a rate limiter (bottleneck or similar) capping 10 requests per second.",
   "covered": false,
   "result_ids": [
    "axios-retry-nock",
    "axios-mock-adapter-client",
    "express-helmet-rate-limit",
    "undici-mockagent-p-retry",
    "cockatiel-retry-circuit-policy",
    "koa-router-zod-supertest",
    "bottleneck-rate-limiting",
    "boltons-funcutils-retry",
    "elysia-typebox-handle-tests",
    "flask-sqlalchemy-app-factory"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": "axios-retry-nock",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.6,
    "error": "my environment's HTTPS_PROXY made axios bypass nock; passed with proxy variables removed",
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 317.4,
      "output_tokens": null,
      "output_chars": 5758,
      "total_tokens": 99382
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 223.0,
      "output_tokens": null,
      "output_chars": 4655,
      "total_tokens": 88566
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 225.8,
      "output_tokens": null,
      "output_chars": 3888,
      "total_tokens": 88715
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 301.7,
      "output_tokens": null,
      "output_chars": 6311,
      "total_tokens": 90580
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 379.7,
      "output_tokens": null,
      "output_chars": 8234,
      "total_tokens": 98004
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 424.3,
      "output_tokens": null,
      "output_chars": 7316,
      "total_tokens": 103662
     }
    ]
   },
   "latency_ms": 175,
   "notes": "top1 axios-retry-nock covers axios-retry backoff (429/5xx, easy to narrow to 503) but no request-rate limiter; no bottleneck+axios recipe in results"
  },
  {
   "task_id": "T073",
   "language": "typescript",
   "libraries": [
    "stripe",
    "express"
   ],
   "category": "messy_question",
   "query": "stripe webhook error No signatures found matching the expected signature for payload express",
   "search_args": {
    "query": "stripe webhook error No signatures found matching the expected signature for payload express"
   },
   "fitting_definition": "Express + Stripe webhook recipe using the raw body (express.raw on the webhook route, ahead of express.json) with constructEvent.",
   "covered": true,
   "result_ids": [
    "express-stripe-webhook",
    "fastapi-stripe-webhook",
    "nextjs-stripe-webhook",
    "twilio-webhook-signature-express",
    "express5-async-error-handling",
    "joi-express-validation",
    "http-errors-express-error-middleware",
    "stripe-checkout-mocked-http",
    "passport-local-express-session",
    "cors-express-preflight"
   ],
   "top1_correct": true,
   "top3_correct": true,
   "uncovered_outcome": null,
   "recipe_id_used": "express-stripe-webhook",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 4.6,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 55.7,
      "output_tokens": null,
      "output_chars": 1970,
      "total_tokens": 66185
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 54.5,
      "output_tokens": null,
      "output_chars": 2177,
      "total_tokens": 66828
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 43.9,
      "output_tokens": null,
      "output_chars": 1841,
      "total_tokens": 66263
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 72.0,
      "output_tokens": null,
      "output_chars": 2988,
      "total_tokens": 66057
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 68.5,
      "output_tokens": null,
      "output_chars": 2999,
      "total_tokens": 65953
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 48.4,
      "output_tokens": null,
      "output_chars": 2915,
      "total_tokens": 64180
     }
    ]
   },
   "latency_ms": 121,
   "notes": "express-stripe-webhook: Express 5 raw-body verification with constructEvent, the fix for the signature error"
  },
  {
   "task_id": "T074",
   "language": "typescript",
   "libraries": [
    "zod"
   ],
   "category": "messy_question",
   "query": "zod custom error message not working after upgrade to v4??",
   "search_args": {
    "query": "zod custom error message not working after upgrade to v4??"
   },
   "fitting_definition": "zod 4 recipe showing custom error messages via the error param (string or function) or z.config customError.",
   "covered": false,
   "result_ids": [
    "zod-v4-json-schema-export",
    "ws-zod-message-protocol",
    "nestjs-zod-validation-pipe",
    "zod-to-openapi-document-generation",
    "koa-router-zod-supertest",
    "gray-matter-zod-frontmatter",
    "better-sqlite3-zod-transactions",
    "cheerio-zod-scrape-fixtures",
    "commander-zod-cli",
    "croner-zod-job-scheduler"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.2,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 156,
   "notes": "results are zod 4.6.7 recipes on other topics (JSON Schema export, ws protocol, NestJS pipe, OpenAPI); none shows the v4 error param or customError"
  },
  {
   "task_id": "T075",
   "language": "typescript",
   "libraries": [
    "express"
   ],
   "category": "messy_question",
   "query": "express 5 crashes on startup TypeError: Missing parameter name at 1 path-to-regexp",
   "search_args": {
    "query": "express 5 crashes on startup TypeError: Missing parameter name at 1 path-to-regexp"
   },
   "fitting_definition": "Express 5 recipe using v5-compatible route paths (named wildcard such as /*splat, braces for optional segments).",
   "covered": false,
   "result_ids": [
    "express5-async-error-handling",
    "joi-express-validation",
    "twilio-webhook-signature-express",
    "cors-express-preflight",
    "http-errors-express-error-middleware",
    "express-stripe-webhook",
    "express-helmet-rate-limit",
    "express-openapi-validator-spec",
    "express-validator-supertest",
    "passport-local-express-session"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.8,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 142,
   "notes": "top1 express5-async-error-handling is Express 5.3.0 but about async errors; nothing shows v5 path syntax (named wildcards) that fixes the path-to-regexp crash"
  },
  {
   "task_id": "T076",
   "language": "typescript",
   "libraries": [
    "prisma",
    "@prisma/client",
    "next"
   ],
   "category": "messy_question",
   "query": "prisma too many connections on vercel serverless, connection pool exhausted what do",
   "search_args": {
    "query": "prisma too many connections on vercel serverless, connection pool exhausted what do"
   },
   "fitting_definition": "Prisma recipe with a global client singleton (dev hot reload) and serverless-friendly pooling (connection_limit, pgbouncer, a driver adapter or Accelerate).",
   "covered": false,
   "result_ids": [
    "prisma-sqlite-adapter",
    "prisma-sqlite-transactions",
    "sqlmodel-relationships-sqlite",
    "zstandard-dictionary-compression",
    "p-limit-concurrency",
    "vercel-ai-sdk-mock-model-tools",
    "knex-better-sqlite3-migrations",
    "objection-knex-sqlite",
    "tortoise-orm-sqlite-relations",
    "blinker-signals-decoupled-events"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 1,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 15.1,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 137,
   "notes": "top1 prisma-sqlite-adapter is Prisma 7 with a SQLite driver adapter; nothing on a client singleton or serverless Postgres pooling (connection_limit, pgbouncer, Accelerate)"
  },
  {
   "task_id": "T077",
   "language": "typescript",
   "libraries": [
    "jest",
    "ts-jest",
    "typescript"
   ],
   "category": "messy_question",
   "query": "jest SyntaxError: Cannot use import statement outside a module with typescript esm project",
   "search_args": {
    "query": "jest SyntaxError: Cannot use import statement outside a module with typescript esm project"
   },
   "fitting_definition": "Jest config for a TypeScript ESM project (ts-jest ESM preset or babel), or a Vitest alternative clearly presented as such.",
   "covered": false,
   "result_ids": [
    "rollup-virtual-module-bundle",
    "json-schema-to-typescript-codegen",
    "openapi-typescript-generate-types",
    "exceljs-read-write",
    "papaparse-zod-csv-import",
    "anthropic-sdk-mocked-tool-use",
    "openpyxl-pydantic-row-import",
    "ts-morph-codegen-ast-edit",
    "esbuild-in-memory-bundle",
    "fuse-js-weighted-search"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.5,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 139,
   "notes": "no Jest/ts-jest recipe; top1 rollup virtual modules"
  },
  {
   "task_id": "T078",
   "language": "typescript",
   "libraries": [
    "drizzle-orm",
    "drizzle-kit",
    "better-sqlite3"
   ],
   "category": "messy_question",
   "query": "drizzle migrate sqlite how?? kit generate doesnt do anything",
   "search_args": {
    "query": "drizzle migrate sqlite how?? kit generate doesnt do anything"
   },
   "fitting_definition": "drizzle-kit config with dialect 'sqlite' and a schema path, generate producing SQL, and migrate() from drizzle-orm/better-sqlite3/migrator at runtime.",
   "covered": false,
   "result_ids": [
    "drizzle-sqlite-crud",
    "drizzle-zod-insert-schemas",
    "hono-drizzle-sqlite-api",
    "authjs-drizzle-adapter-pglite",
    "drizzle-pglite-migrations",
    "drizzle-pglite-postgres",
    "kysely-sqlite-queries",
    "prisma-sqlite-adapter",
    "prisma-sqlite-transactions",
    "sqlalchemy-alembic-autogenerate-check"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 1,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 9.5,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 344,
   "notes": "top1 drizzle-sqlite-crud is drizzle+better-sqlite3 but explicitly migrations-free table creation; nothing shows drizzle-kit generate or migrate(); stack filter with drizzle-kit returns 0 (relabelled partial for consistency with T059)"
  },
  {
   "task_id": "T079",
   "language": "typescript",
   "libraries": [
    "openai",
    "express"
   ],
   "category": "messy_question",
   "query": "openai streaming response in express and send it to the browser as SSE chunks",
   "search_args": {
    "query": "openai streaming response in express and send it to the browser as SSE chunks"
   },
   "fitting_definition": "Express route calling OpenAI with stream: true and writing server-sent events (text/event-stream) per chunk, handling client disconnect.",
   "covered": false,
   "result_ids": [
    "openai-streaming-mock",
    "express-openapi-validator-spec",
    "openai-structured-output-respx",
    "openai-python-respx-mock",
    "openai-sdk-mocked-tool-calls",
    "twilio-webhook-signature-express",
    "passport-local-express-session",
    "cors-express-preflight",
    "express5-async-error-handling",
    "http-errors-express-error-middleware"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": "openai-streaming-mock",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 2,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 4.2,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 82.1,
      "output_tokens": null,
      "output_chars": 2452,
      "total_tokens": 75831
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 103.9,
      "output_tokens": null,
      "output_chars": 2912,
      "total_tokens": 75226
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 71.7,
      "output_tokens": null,
      "output_chars": 2387,
      "total_tokens": 69988
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 44.5,
      "output_tokens": null,
      "output_chars": 2837,
      "total_tokens": 63794
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 53.6,
      "output_tokens": null,
      "output_chars": 2483,
      "total_tokens": 64177
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 56.4,
      "output_tokens": null,
      "output_chars": 2733,
      "total_tokens": 64623
     }
    ]
   },
   "latency_ms": 151,
   "notes": "top1 openai-streaming-mock covers Node SDK streaming and aborts but not Express or SSE output; stack [openai,express] returns 0"
  },
  {
   "task_id": "T080",
   "language": "typescript",
   "libraries": [
    "next"
   ],
   "category": "messy_question",
   "query": "next js app router cookies() returns a promise now?? how do i read the session cookie in server component and route handler",
   "search_args": {
    "query": "next js app router cookies() returns a promise now?? how do i read the session cookie in server component and route handler"
   },
   "fitting_definition": "Next.js >= 15 recipe using await cookies() in a server component and in a route handler.",
   "covered": false,
   "result_ids": [
    "nextjs-stripe-webhook",
    "nextjs-route-handler-zod",
    "nextjs-supabase-auth-middleware",
    "nextjs-server-action-zod",
    "nextauth-credentials-callbacks",
    "returns-maybe-ioresult",
    "express-session-cookie-e2e",
    "tough-cookie-jar",
    "set-cookie-parser-split",
    "passport-local-express-session"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 14.3,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 147,
   "notes": "top1 is the Next.js Stripe webhook route; #3 Supabase middleware refreshes cookies in middleware but nothing shows await cookies() in a server component or route handler"
  },
  {
   "task_id": "T081",
   "language": "python",
   "libraries": [
    "ortools"
   ],
   "category": "likely_uncovered",
   "query": "solve a sudoku with the OR-Tools CP-SAT solver in Python",
   "search_args": {
    "query": "solve a sudoku with the OR-Tools CP-SAT solver in Python"
   },
   "fitting_definition": "CP-SAT model with AddAllDifferent constraints for rows, columns and boxes, solved and read back.",
   "covered": false,
   "result_ids": [
    "mcp-sdk-inmemory-tools",
    "vercel-ai-sdk-mock-model-tools",
    "python-json-logger-structured",
    "graphql-tools-schema-mock",
    "python-multipart-starlette-forms",
    "python-docx-table-report",
    "python-slugify-unidecode-titles",
    "python-dotenv-pydantic-settings-env",
    "langchainjs-zod-tools",
    "python-box-dot-access-config"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": "none",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 5.4,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 93.3,
      "output_tokens": null,
      "output_chars": 5696,
      "total_tokens": 69336
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 79.5,
      "output_tokens": null,
      "output_chars": 3872,
      "total_tokens": 66455
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 50.0,
      "output_tokens": null,
      "output_chars": 4039,
      "total_tokens": 64420
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 38.5,
      "output_tokens": null,
      "output_chars": 4356,
      "total_tokens": 63287
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 42.5,
      "output_tokens": null,
      "output_chars": 4122,
      "total_tokens": 62768
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 33.4,
      "output_tokens": null,
      "output_chars": 4672,
      "total_tokens": 62719
     }
    ]
   },
   "latency_ms": 142,
   "notes": "no OR-Tools recipe; top1 is a TypeScript MCP SDK recipe for a Python sudoku query; language-filtered results are unrelated Python libs; stack filter 0"
  },
  {
   "task_id": "T082",
   "language": "python",
   "libraries": [
    "textual"
   ],
   "category": "likely_uncovered",
   "query": "Textual TUI app with a DataTable and key bindings",
   "search_args": {
    "query": "Textual TUI app with a DataTable and key bindings"
   },
   "fitting_definition": "textual App with a DataTable widget and BINDINGS, ideally tested with the run_test pilot.",
   "covered": false,
   "result_ids": [
    "cryptography-fernet-multi-key",
    "babel-codemod-parse-traverse",
    "nextjs-stripe-webhook",
    "jose-jwks-verify",
    "litestar-dto-sqlalchemy",
    "litestar-guards-di",
    "ruamel-yaml-roundtrip-comments",
    "bidict-two-way-map",
    "injector-di-modules",
    "nextjs-route-handler-zod"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 6,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 1.2,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 145,
   "notes": "no Textual recipe (stack filter 0); top1 cryptography MultiFernet"
  },
  {
   "task_id": "T083",
   "language": "python",
   "libraries": [
    "xarray",
    "cfgrib"
   ],
   "category": "likely_uncovered",
   "query": "read a GRIB2 weather forecast with xarray and cfgrib and extract 2m temperature at a lat lon",
   "search_args": {
    "query": "read a GRIB2 weather forecast with xarray and cfgrib and extract 2m temperature at a lat lon"
   },
   "fitting_definition": "xr.open_dataset(engine='cfgrib') with filter_by_keys and .sel(latitude=..., longitude=..., method='nearest').",
   "covered": false,
   "result_ids": [
    "tar-pack-extract",
    "pandas-sqlalchemy-to-sql",
    "pandas-openpyxl-excel-report",
    "ajv-standalone-validation",
    "exceljs-read-write",
    "polib-po-catalog-roundtrip",
    "chrono-node-reference-date",
    "pyotp-totp-freezegun",
    "markdown-pygments-codehilite",
    "pdf-lib-invoice"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 2,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.5,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 143,
   "notes": "no xarray/cfgrib recipe; top1 node-tar (TypeScript)"
  },
  {
   "task_id": "T084",
   "language": "python",
   "libraries": [
    "hl7apy"
   ],
   "category": "likely_uncovered",
   "query": "parse HL7 v2 ADT A01 message in Python with hl7apy and get patient name and MRN",
   "search_args": {
    "query": "parse HL7 v2 ADT A01 message in Python with hl7apy and get patient name and MRN"
   },
   "fitting_definition": "hl7apy parser.parse_message on an ADT message, reading PID fields.",
   "covered": false,
   "result_ids": [
    "fastapi-pydantic-v2-models",
    "python-multipart-starlette-forms",
    "python-json-logger-structured",
    "python-docx-table-report",
    "python-dotenv-pydantic-settings-env",
    "python-box-dot-access-config",
    "python-slugify-unidecode-titles",
    "ulid-pydantic-custom-type",
    "csv-parse-stringify-streams",
    "deepdiff-pydantic-compare"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 1.7,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 163,
   "notes": "no hl7apy recipe (stack filter 0); top1 FastAPI Pydantic patterns"
  },
  {
   "task_id": "T085",
   "language": "python",
   "libraries": [
    "weasyprint",
    "jinja2"
   ],
   "category": "likely_uncovered",
   "query": "generate PDF invoice from an HTML Jinja2 template with WeasyPrint",
   "search_args": {
    "query": "generate PDF invoice from an HTML Jinja2 template with WeasyPrint"
   },
   "fitting_definition": "Jinja2 template rendering plus weasyprint.HTML(string=...).write_pdf().",
   "covered": false,
   "result_ids": [
    "jinja2-markupsafe-email-templates",
    "fastapi-jinja2-htmx-partials",
    "jinja2-sandboxed-user-templates",
    "pdf-lib-invoice",
    "pdfkit-generate-pdf",
    "mako-template-inheritance",
    "mjml-to-html",
    "react-email-render-html-text",
    "node-html-parser-query",
    "fpdf2-multipage-table"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 6,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 1.0,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 167,
   "notes": "no WeasyPrint recipe (stack filter 0); top1 Jinja2 email templates covers only the templating half; #4 is TypeScript pdf-lib"
  },
  {
   "task_id": "T086",
   "language": "python",
   "libraries": [
    "psycopg"
   ],
   "category": "likely_uncovered",
   "query": "retry PostgreSQL SERIALIZABLE transaction on serialization failure SQLSTATE 40001 with psycopg 3",
   "search_args": {
    "query": "retry PostgreSQL SERIALIZABLE transaction on serialization failure SQLSTATE 40001 with psycopg 3"
   },
   "fitting_definition": "psycopg 3 transaction at SERIALIZABLE isolation in a retry loop catching psycopg.errors.SerializationFailure (rollback and retry). A generic HTTP retry or tenacity recipe is NOT fitting.",
   "covered": false,
   "result_ids": [
    "drizzle-pglite-migrations",
    "drizzle-pglite-postgres",
    "authjs-drizzle-adapter-pglite",
    "pg-mem-kysely-postgres-tests",
    "cockatiel-retry-circuit-policy",
    "boltons-funcutils-retry",
    "undici-mockagent-p-retry",
    "axios-retry-nock",
    "devalue-serialize-cycles",
    "vue-pinia-testing"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 32.5,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 160,
   "notes": "no psycopg recipe (stack filter 0); s1 top results are TypeScript Drizzle/PGlite; s2 top1 is a generic boltons retry decorator (the trap the definition excludes)"
  },
  {
   "task_id": "T087",
   "language": "python",
   "libraries": [
    "app-store-server-library",
    "cryptography",
    "pyjwt"
   ],
   "category": "likely_uncovered",
   "query": "verify Apple App Store Server Notification V2 signedPayload JWS including the x5c certificate chain",
   "search_args": {
    "query": "verify Apple App Store Server Notification V2 signedPayload JWS including the x5c certificate chain"
   },
   "fitting_definition": "Verifies the JWS using the x5c chain up to Apple Root CA G3 (for example app-store-server-library SignedDataVerifier, or cryptography chain validation + PyJWT). A plain HS256 JWT recipe is NOT fitting.",
   "covered": false,
   "result_ids": [
    "fastapi-pydantic-v2-models",
    "node-forge-self-signed-cert",
    "vue-server-renderer-ssr",
    "nextjs-server-action-zod",
    "nextjs-stripe-webhook",
    "aiohttp-pytest-plugin-client",
    "apollo-server-dataloader-batching",
    "trpc-client-server-superjson",
    "feedparser-pydantic-models",
    "zustand-store-vitest"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 1.7,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 156,
   "notes": "nothing about Apple JWS/x5c; top1 is a FastAPI Pydantic recipe, #2 node-forge self-signed cert (TS)"
  },
  {
   "task_id": "T088",
   "language": "python",
   "libraries": [
    "python-stdlib"
   ],
   "category": "likely_uncovered",
   "query": "implement an LRU cache from scratch in Python without functools or any library, O(1) get and put",
   "search_args": {
    "query": "implement an LRU cache from scratch in Python without functools or any library, O(1) get and put"
   },
   "fitting_definition": "Hand-written dict + doubly linked list LRU with O(1) get/put. A recipe that uses functools.lru_cache, cachetools or Redis is NOT fitting.",
   "covered": false,
   "result_ids": [
    "lru-cache-ttl",
    "cache-manager-memory-store",
    "tanstack-query-core-cache",
    "jotai-atoms-react-testing-library",
    "preact-signals-testing-library",
    "diskcache-cachetools-tiered",
    "ioredis-cache-aside-mock",
    "solid-signals-testing-library",
    "ink-testing-library-cli",
    "valibot-transforms-pipeline"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": "none",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.1,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 48.0,
      "output_tokens": null,
      "output_chars": 4064,
      "total_tokens": 72310
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 55.6,
      "output_tokens": null,
      "output_chars": 4118,
      "total_tokens": 73369
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 53.0,
      "output_tokens": null,
      "output_chars": 4140,
      "total_tokens": 72322
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 25.4,
      "output_tokens": null,
      "output_chars": 3485,
      "total_tokens": 61355
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 26.7,
      "output_tokens": null,
      "output_chars": 4108,
      "total_tokens": 61400
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 26.7,
      "output_tokens": null,
      "output_chars": 3796,
      "total_tokens": 61532
     }
    ]
   },
   "latency_ms": 139,
   "notes": "trap task: top1 is the TypeScript lru-cache library; s2 top1 is diskcache+cachetools; both are library-based caches that the task excludes"
  },
  {
   "task_id": "T089",
   "language": "python",
   "libraries": [
    "gpiozero"
   ],
   "category": "likely_uncovered",
   "query": "blink an LED and read a push button on Raspberry Pi with gpiozero",
   "search_args": {
    "query": "blink an LED and read a push button on Raspberry Pi with gpiozero"
   },
   "fitting_definition": "gpiozero LED and Button usage (ideally with the mock pin factory for tests).",
   "covered": false,
   "result_ids": [
    "web-push-vapid-payload-encryption",
    "pandas-sqlalchemy-to-sql",
    "clsx-tailwind-merge-cva",
    "pandas-openpyxl-excel-report",
    "exceljs-read-write",
    "polib-po-catalog-roundtrip",
    "django-celery-eager-signals",
    "elysia-typebox-handle-tests",
    "litestar-dto-sqlalchemy",
    "sqlalchemy-async-repository-pattern"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 5,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.7,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 159,
   "notes": "no gpiozero recipe; top1 is a TypeScript web-push recipe"
  },
  {
   "task_id": "T090",
   "language": "python",
   "libraries": [
    "litestar",
    "msgspec"
   ],
   "category": "likely_uncovered",
   "query": "Litestar app with msgspec Struct request bodies and dependency injection",
   "search_args": {
    "query": "Litestar app with msgspec Struct request bodies and dependency injection"
   },
   "fitting_definition": "Litestar app using msgspec.Struct as request/response models and Provide-based dependency injection, ideally tested with litestar.testing.",
   "covered": false,
   "result_ids": [
    "litestar-guards-di",
    "litestar-dto-sqlalchemy",
    "msgspec-struct-validation",
    "orjson-msgspec-encode-parity",
    "msgspec-json-schema-generation",
    "msgspec-msgpack-tagged-unions",
    "awilix-di-container",
    "fastapi-dependency-injector-wiring",
    "fastapi-dependency-overrides-httpx",
    "injector-di-modules"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": "litestar-guards-di",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 5,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.4,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 151.6,
      "output_tokens": null,
      "output_chars": 3425,
      "total_tokens": 80006
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 74.9,
      "output_tokens": null,
      "output_chars": 3020,
      "total_tokens": 71678
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 115.9,
      "output_tokens": null,
      "output_chars": 3877,
      "total_tokens": 75558
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 142.6,
      "output_tokens": null,
      "output_chars": 4784,
      "total_tokens": 74939
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 71.5,
      "output_tokens": null,
      "output_chars": 4134,
      "total_tokens": 66689
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 120.1,
      "output_tokens": null,
      "output_chars": 4578,
      "total_tokens": 71921
     }
    ]
   },
   "latency_ms": 147,
   "notes": "code: litestar-guards-di has Provide-based DI but no request bodies and no msgspec Structs at all; no Litestar+msgspec recipe in the index"
  },
  {
   "task_id": "T091",
   "language": "typescript",
   "libraries": [
    "effect"
   ],
   "category": "likely_uncovered",
   "query": "Effect-TS: decode input with Schema, typed tagged errors, and provide a service via Layer",
   "search_args": {
    "query": "Effect-TS: decode input with Schema, typed tagged errors, and provide a service via Layer"
   },
   "fitting_definition": "effect recipe using Schema decoding, tagged errors (Data.TaggedError or Schema.TaggedError), a service tag and a Layer provided to a program.",
   "covered": false,
   "result_ids": [
    "effect-schema-vitest",
    "io-ts-codec-decode",
    "ts-morph-codegen-ast-edit",
    "msgspec-json-schema-generation",
    "deepmerge-ts-nested",
    "ts-pattern-discriminated-unions",
    "http-errors-express-error-middleware",
    "ajv-formats-json-schema",
    "json-schema-to-typescript-codegen",
    "graphql-tools-schema-mock"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": "effect-schema-vitest",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 5,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 7.6,
    "error": "npm 10.9.4 crashed in npm install (edgesOut); passed when the same setup ran through npx npm@11.6.0, as ProvenPin's runner does",
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 118.7,
      "output_tokens": null,
      "output_chars": 3263,
      "total_tokens": 76434
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 124.4,
      "output_tokens": null,
      "output_chars": 3768,
      "total_tokens": 77384
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 168.4,
      "output_tokens": null,
      "output_chars": 3637,
      "total_tokens": 81203
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 245.7,
      "output_tokens": null,
      "output_chars": 4897,
      "total_tokens": 86434
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 285.3,
      "output_tokens": null,
      "output_chars": 4954,
      "total_tokens": 90378
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 367.4,
      "output_tokens": null,
      "output_chars": 5264,
      "total_tokens": 100043
     }
    ]
   },
   "latency_ms": 244,
   "notes": "top1 effect-schema-vitest (effect 4.0.5) covers Schema decoding and TaggedError but its summary has no service tag or Layer, a core part of the task"
  },
  {
   "task_id": "T092",
   "language": "typescript",
   "libraries": [
    "bun"
   ],
   "category": "likely_uncovered",
   "query": "Bun.serve websocket server with pub/sub topics",
   "search_args": {
    "query": "Bun.serve websocket server with pub/sub topics"
   },
   "fitting_definition": "Bun.serve with websocket handlers using ws.subscribe and server.publish.",
   "covered": false,
   "result_ids": [
    "ws-zod-message-protocol",
    "nextjs-server-action-zod",
    "fastapi-websocket-auth",
    "apollo-server-dataloader-batching",
    "trpc-client-server-superjson",
    "vue-server-renderer-ssr",
    "flask-marshmallow-webargs",
    "hapi-server-inject-joi",
    "aiohttp-pytest-plugin-client",
    "trpc-zod-router"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.0,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 143,
   "notes": "no Bun recipe; top1 ws-zod-message-protocol is a Node ws room-chat server: same topic (websocket rooms) but not Bun.serve pub/sub"
  },
  {
   "task_id": "T093",
   "language": "typescript",
   "libraries": [
    "deno"
   ],
   "category": "likely_uncovered",
   "query": "Deno KV atomic transaction counter with optimistic concurrency check",
   "search_args": {
    "query": "Deno KV atomic transaction counter with optimistic concurrency check"
   },
   "fitting_definition": "Deno.openKv with kv.atomic().check(...).set()/sum().commit() in a retry loop.",
   "covered": false,
   "result_ids": [
    "p-map-concurrency-limit",
    "p-queue-concurrency",
    "bottleneck-rate-limiting",
    "p-limit-concurrency",
    "keyv-memory-ttl",
    "async-mutex-critical-section",
    "redux-toolkit-rtk-query-msw",
    "p-queue-priority",
    "diskcache-filelock-jobs",
    "pytest-asyncio-taskgroup-timeouts"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 1,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.4,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 135,
   "notes": "nothing about Deno or Deno KV; results are p-map/p-queue/bottleneck concurrency helpers"
  },
  {
   "task_id": "T094",
   "language": "typescript",
   "libraries": [
    "cloudflare-workers",
    "wrangler"
   ],
   "category": "likely_uncovered",
   "query": "rate limiter using a Cloudflare Durable Object in a Worker",
   "search_args": {
    "query": "rate limiter using a Cloudflare Durable Object in a Worker"
   },
   "fitting_definition": "Worker + Durable Object class (storage or in-memory with alarms) implementing per-key rate limiting, with wrangler configuration.",
   "covered": false,
   "result_ids": [
    "rate-limiter-flexible-memory",
    "express-helmet-rate-limit",
    "throttle-debounce-fns",
    "limits-moving-window-memory",
    "fastapi-slowapi-rate-limit",
    "bottleneck-rate-limiting",
    "aiolimiter-httpx-rate-limit",
    "dequal-object-hash-compare",
    "dot-prop-nested-paths",
    "python-json-logger-structured"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 8,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.1,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 145,
   "notes": "no Cloudflare Workers/Durable Object recipe; top1 rate-limiter-flexible in-memory matches the rate-limit topic but cannot work as a Durable Object"
  },
  {
   "task_id": "T095",
   "language": "typescript",
   "libraries": [
    "@temporalio/workflow",
    "@temporalio/client",
    "@temporalio/worker"
   ],
   "category": "likely_uncovered",
   "query": "Temporal TypeScript SDK workflow with signals and queries",
   "search_args": {
    "query": "Temporal TypeScript SDK workflow with signals and queries"
   },
   "fitting_definition": "Workflow using defineSignal/defineQuery/setHandler, plus a worker and a client that starts and signals it.",
   "covered": false,
   "result_ids": [
    "temporal-polyfill-dates",
    "transitions-fsm-callbacks",
    "json-schema-to-typescript-codegen",
    "openapi-typescript-generate-types",
    "anthropic-sdk-mocked-tool-use",
    "django-celery-eager-signals",
    "aws-sdk-v3-dynamodb-sqs-vitest",
    "preact-signals-testing-library",
    "anthropic-streaming-mock",
    "aws-sdk-v3-s3-client-mock"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 2,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.2,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 130,
   "notes": "name collision: top1 is the JS Temporal date polyfill, not the Temporal workflow SDK; no @temporalio recipe (stack filter 0)"
  },
  {
   "task_id": "T096",
   "language": "typescript",
   "libraries": [
    "electron"
   ],
   "category": "likely_uncovered",
   "query": "secure Electron IPC with contextBridge preload and contextIsolation enabled",
   "search_args": {
    "query": "secure Electron IPC with contextBridge preload and contextIsolation enabled"
   },
   "fitting_definition": "Preload using contextBridge.exposeInMainWorld + ipcRenderer.invoke, main process ipcMain.handle, contextIsolation true and nodeIntegration false.",
   "covered": false,
   "result_ids": [
    "nanoid-custom-alphabet",
    "knex-better-sqlite3-migrations",
    "arktype-schema-validation",
    "arrow-time-machine-shift",
    "attrs-cattrs-structuring",
    "aws-sdk-v3-dynamodb-sqs-vitest",
    "boto3-moto-dynamodb-sqs",
    "boto3-moto-s3-presigned",
    "bottleneck-rate-limiting",
    "cheerio-zod-scrape-fixtures"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.0,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 148,
   "notes": "no Electron recipe; top1 nanoid"
  },
  {
   "task_id": "T097",
   "language": "typescript",
   "libraries": [
    "three"
   ],
   "category": "likely_uncovered",
   "query": "Three.js WebGPU renderer with a TSL compute shader for particles",
   "search_args": {
    "query": "Three.js WebGPU renderer with a TSL compute shader for particles"
   },
   "fitting_definition": "WebGPURenderer + TSL (three/tsl) compute node updating particle positions.",
   "covered": false,
   "result_ids": [
    "vue-server-renderer-ssr",
    "structlog-stdlib-json-renderer",
    "yup-form-schemas",
    "inflect-plural-ordinal",
    "natsort-natural-sorting",
    "pytest-hypothesis-pydantic-roundtrip",
    "openai-streaming-mock",
    "pino-redaction-custom-transport",
    "ws-zod-message-protocol",
    "apscheduler-time-machine-jobs"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 3.7,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 140,
   "notes": "no three.js recipe; top1 Vue SSR"
  },
  {
   "task_id": "T098",
   "language": "typescript",
   "libraries": [
    "ts-json-schema-generator"
   ],
   "category": "likely_uncovered",
   "query": "generate JSON Schema from existing TypeScript interfaces at build time, not from zod schemas",
   "search_args": {
    "query": "generate JSON Schema from existing TypeScript interfaces at build time, not from zod schemas"
   },
   "fitting_definition": "ts-json-schema-generator (or typescript-json-schema) reading TypeScript types to emit JSON Schema. zod-to-json-schema or z.toJSONSchema recipes are NOT fitting.",
   "covered": false,
   "result_ids": [
    "json-schema-to-typescript-codegen",
    "zod-v4-json-schema-export",
    "zod-to-openapi-document-generation",
    "drizzle-zod-insert-schemas",
    "fastify-zod-type-provider",
    "langchainjs-zod-tools",
    "react-hook-form-zod-resolver",
    "nestjs-zod-validation-pipe",
    "ajv-standalone-validation",
    "hono-zod-openapi"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": "none",
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 4.5,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 157.1,
      "output_tokens": null,
      "output_chars": 3167,
      "total_tokens": 84036
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 112.7,
      "output_tokens": null,
      "output_chars": 3454,
      "total_tokens": 76306
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 152.9,
      "output_tokens": null,
      "output_chars": 4446,
      "total_tokens": 83811
     }
    ],
    "without_recipe": [
     {
      "run": 1,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 69.6,
      "output_tokens": null,
      "output_chars": 3021,
      "total_tokens": 66509
     },
     {
      "run": 2,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 183.6,
      "output_tokens": null,
      "output_chars": 5326,
      "total_tokens": 79519
     },
     {
      "run": 3,
      "passed_first_try": true,
      "passed": true,
      "attempts": 1,
      "seconds": 60.4,
      "output_tokens": null,
      "output_chars": 3336,
      "total_tokens": 65653
     }
    ]
   },
   "latency_ms": 168,
   "notes": "top1 json-schema-to-typescript goes the opposite direction (JSON Schema -> TS types); #2 is zod z.toJSONSchema which the task excludes; no ts-json-schema-generator recipe (stack filter 0)"
  },
  {
   "task_id": "T099",
   "language": "typescript",
   "libraries": [
    "@stripe/stripe-terminal-react-native"
   ],
   "category": "likely_uncovered",
   "query": "Stripe Terminal React Native: discover and connect a Bluetooth card reader and collect a payment",
   "search_args": {
    "query": "Stripe Terminal React Native: discover and connect a Bluetooth card reader and collect a payment"
   },
   "fitting_definition": "stripe-terminal-react-native StripeTerminalProvider, discoverReaders/connectReader and collectPaymentMethod/confirmPaymentIntent. Stripe webhook or Checkout recipes are NOT fitting.",
   "covered": false,
   "result_ids": [
    "fastapi-stripe-webhook",
    "express-stripe-webhook",
    "nextjs-stripe-webhook",
    "ink-testing-library-cli",
    "stripe-checkout-mocked-http",
    "jotai-atoms-react-testing-library",
    "react-email-render-html-text",
    "i18next-react-ssr",
    "react-query-testing-library",
    "react-router-loader-action"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "misleading",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 3,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 2.6,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 137,
   "notes": "trap task: top results are Stripe webhook recipes (FastAPI, Express, Next.js), which look relevant by name but do nothing for Terminal reader discovery/collection"
  },
  {
   "task_id": "T100",
   "language": "typescript",
   "libraries": [
    "typescript"
   ],
   "category": "likely_uncovered",
   "query": "my generic TypeScript function widens literal types to string, how to keep literals with const type parameters",
   "search_args": {
    "query": "my generic TypeScript function widens literal types to string, how to keep literals with const type parameters"
   },
   "fitting_definition": "TypeScript >= 5.0 example of <const T> type parameters (or as const) preserving literal types. Non-glue; any library recipe is NOT fitting.",
   "covered": false,
   "result_ids": [
    "json-schema-to-typescript-codegen",
    "openapi-typescript-generate-types",
    "mime-types-lookup",
    "file-type-buffer-detect",
    "fastify-zod-type-provider",
    "preact-render-to-string-ssr",
    "ts-morph-codegen-ast-edit",
    "typeguard-runtime-typecheck",
    "magic-string-sourcemap-edits",
    "rapidfuzz-fuzzy-match"
   ],
   "top1_correct": null,
   "top3_correct": null,
   "uncovered_outcome": "unrelated",
   "recipe_id_used": null,
   "recipe_run": {
    "ran": true,
    "passed": true,
    "tests_passed": 4,
    "tests_failed": 0,
    "install_ok": true,
    "seconds": 4.5,
    "error": null,
    "level": "executed"
   },
   "integrity": {
    "checked": true,
    "hashes_match": true,
    "pins_match_manifest": true,
    "receipts_feed_match": true,
    "status_passed": true,
    "level": "executed"
   },
   "arms": {
    "with_recipe": [],
    "without_recipe": []
   },
   "latency_ms": 125,
   "notes": "non-glue TypeScript language question; top1 json-schema-to-typescript codegen"
  }
 ],
 "version_checks": [
  {
   "check_id": "V01",
   "tool": "get_recipe",
   "recipe_id": "express-stripe-webhook",
   "versions_input_kind": "map",
   "expected": "express exact, stripe exact",
   "observed": "overall exact, format map: express exact (tested 5.3.0, yours 5.3.0); stripe exact (tested 23.0.0, yours 23.0.0)",
   "correct": true
  },
  {
   "check_id": "V02",
   "tool": "get_recipe",
   "recipe_id": "express-stripe-webhook",
   "versions_input_kind": "map",
   "expected": "express compatible (newer patch)",
   "observed": "overall compatible, format map: express compatible (tested 5.3.0, yours 5.3.1); stripe exact (tested 23.0.0, yours 23.0.0)",
   "correct": true
  },
  {
   "check_id": "V03",
   "tool": "get_recipe",
   "recipe_id": "express-stripe-webhook",
   "versions_input_kind": "map",
   "expected": "stripe compatible (newer minor)",
   "observed": "overall compatible, format map: express exact (tested 5.3.0, yours 5.3.0); stripe compatible (tested 23.0.0, yours 23.4.0)",
   "correct": true
  },
  {
   "check_id": "V04",
   "tool": "get_recipe",
   "recipe_id": "express-stripe-webhook",
   "versions_input_kind": "map",
   "expected": "express mismatch (older major) with a clear warning",
   "observed": "overall mismatch, format map: express mismatch (tested 5.3.0, yours 4.21.2); stripe exact (tested 23.0.0, yours 23.0.0)",
   "correct": true
  },
  {
   "check_id": "V05",
   "tool": "get_recipe",
   "recipe_id": "express-stripe-webhook",
   "versions_input_kind": "map",
   "expected": "stripe mismatch (newer major) with a warning",
   "observed": "overall mismatch, format map: express exact (tested 5.3.0, yours 5.3.0); stripe mismatch (tested 23.0.0, yours 24.0.0)",
   "correct": true
  },
  {
   "check_id": "V06",
   "tool": "get_recipe",
   "recipe_id": "express-stripe-webhook",
   "versions_input_kind": "map",
   "expected": "express exact, stripe not_in_project",
   "observed": "overall exact, format map: express exact (tested 5.3.0, yours 5.3.0); stripe not_in_project (tested 23.0.0, yours None)",
   "correct": true
  },
  {
   "check_id": "V07",
   "tool": "get_recipe",
   "recipe_id": "drizzle-sqlite-crud",
   "versions_input_kind": "map",
   "expected": "drizzle-orm mismatch (0.x minor bump is breaking), better-sqlite3 exact",
   "observed": "overall mismatch, format map: drizzle-orm mismatch (tested 0.45.4, yours 0.46.0); better-sqlite3 exact (tested 12.11.1, yours 12.11.1)",
   "correct": true
  },
  {
   "check_id": "V08",
   "tool": "get_recipe",
   "recipe_id": "drizzle-sqlite-crud",
   "versions_input_kind": "map",
   "expected": "drizzle-orm compatible (0.x patch bump)",
   "observed": "overall compatible, format map: drizzle-orm compatible (tested 0.45.4, yours 0.45.5); better-sqlite3 exact (tested 12.11.1, yours 12.11.1)",
   "correct": true
  },
  {
   "check_id": "V09",
   "tool": "get_recipe",
   "recipe_id": "hono-zod-validator",
   "versions_input_kind": "map",
   "expected": "@hono/zod-validator mismatch (scoped package, 0.x minor bump), hono and zod exact",
   "observed": "overall mismatch, format map: hono exact (tested 4.13.13, yours 4.13.13); zod exact (tested 4.6.7, yours 4.6.7); @hono/zod-validator mismatch (tested 0.9.1, yours 0.10.0)",
   "correct": true
  },
  {
   "check_id": "V10",
   "tool": "get_recipe",
   "recipe_id": "fastapi-stripe-webhook",
   "versions_input_kind": "map",
   "expected": "fastapi mismatch (0.x minor bump), stripe and httpx exact, pytest not_in_project",
   "observed": "overall mismatch, format map: fastapi mismatch (tested 0.143.1, yours 0.144.0); stripe exact (tested 16.0.0, yours 16.0.0); httpx exact (tested 0.28.1, yours 0.28.1)",
   "correct": false
  },
  {
   "check_id": "V11",
   "tool": "get_recipe",
   "recipe_id": "express-stripe-webhook",
   "versions_input_kind": "package-lock.json",
   "expected": "express exact (5.3.0), stripe mismatch (lockfile has 22.0.0, older major)",
   "observed": "overall mismatch, format package-lock.json: express exact (tested 5.3.0, yours 5.3.0); stripe mismatch (tested 23.0.0, yours 22.0.0)",
   "correct": true
  },
  {
   "check_id": "V12",
   "tool": "get_recipe",
   "recipe_id": "hono-zod-validator",
   "versions_input_kind": "pnpm-lock.yaml",
   "expected": "hono exact, @hono/zod-validator exact, zod mismatch (lockfile has 3.25.76, older major)",
   "observed": "overall mismatch, format pnpm-lock.yaml: hono exact (tested 4.13.13, yours 4.13.13); zod mismatch (tested 4.6.7, yours 3.25.76); @hono/zod-validator exact (tested 0.9.1, yours 0.9.1)",
   "correct": true
  },
  {
   "check_id": "V13",
   "tool": "get_recipe",
   "recipe_id": "express-stripe-webhook",
   "versions_input_kind": "yarn.lock",
   "expected": "express exact, stripe exact",
   "observed": "overall exact, format yarn.lock: express exact (tested 5.3.0, yours 5.3.0); stripe exact (tested 23.0.0, yours 23.0.0)",
   "correct": true
  },
  {
   "check_id": "V14",
   "tool": "get_recipe",
   "recipe_id": "fastapi-stripe-webhook",
   "versions_input_kind": "requirements.txt",
   "expected": "fastapi compatible (0.143.3 vs 0.143.1 patch), stripe exact, httpx exact, pytest not_in_project",
   "observed": "overall compatible, format requirements.txt: fastapi compatible (tested 0.143.1, yours 0.143.3); stripe exact (tested 16.0.0, yours 16.0.0); httpx exact (tested 0.28.1, yours 0.28.1)",
   "correct": false
  },
  {
   "check_id": "V15",
   "tool": "get_recipe",
   "recipe_id": "fastapi-stripe-webhook",
   "versions_input_kind": "poetry.lock",
   "expected": "fastapi mismatch (0.144.0, 0.x minor), stripe mismatch (15.2.0, older major), httpx exact",
   "observed": "overall mismatch, format poetry.lock: fastapi mismatch (tested 0.143.1, yours 0.144.0); stripe mismatch (tested 16.0.0, yours 15.2.0); httpx exact (tested 0.28.1, yours 0.28.1)",
   "correct": true
  },
  {
   "check_id": "V16",
   "tool": "get_recipe",
   "recipe_id": "fastapi-stripe-webhook",
   "versions_input_kind": "uv.lock",
   "expected": "fastapi compatible (0.143.3), stripe exact, httpx exact (pytest not in the lock: not_in_project)",
   "observed": "overall compatible, format uv.lock: fastapi compatible (tested 0.143.1, yours 0.143.3); stripe exact (tested 16.0.0, yours 16.0.0); httpx exact (tested 0.28.1, yours 0.28.1)",
   "correct": false
  },
  {
   "check_id": "V17",
   "tool": "get_recipe",
   "recipe_id": "pydantic-settings-config",
   "versions_input_kind": "map",
   "expected": "pydantic-settings exact after PEP 503 name normalization (not not_in_project)",
   "observed": "overall exact, format map: pydantic exact (tested 2.14.1, yours 2.14.1); pydantic-settings exact (tested 2.16.0, yours 2.16.0)",
   "correct": true
  },
  {
   "check_id": "V18",
   "tool": "get_recipe",
   "recipe_id": "marshmallow-sqlalchemy-flask-api",
   "versions_input_kind": "requirements.txt",
   "expected": "Flask-SQLAlchemy==3.1.1 matches flask-sqlalchemy exact; Flask==3.1.3 exact; marshmallow==4.3.1 mismatch (recipe pins 3.26.1, newer major)",
   "observed": "overall mismatch, format requirements.txt: flask exact (tested 3.1.3, yours 3.1.3); flask-sqlalchemy exact (tested 3.1.1, yours 3.1.1); marshmallow-sqlalchemy not_in_project (tested 1.5.0, yours None); marshmallow mismatch (tested 3.26.1, yours 4.3.1); sqlalchemy not_in_project (tested 2.0.36, yours None)",
   "correct": true
  },
  {
   "check_id": "V19",
   "tool": "get_recipe",
   "recipe_id": "express-stripe-webhook",
   "versions_input_kind": "package.json",
   "expected": "express exact, stripe exact (exact specs in package.json)",
   "observed": "overall exact, format package.json: express exact (tested 5.3.0, yours 5.3.0); stripe exact (tested 23.0.0, yours 23.0.0)",
   "correct": true
  },
  {
   "check_id": "V20",
   "tool": "get_recipe",
   "recipe_id": "express-stripe-webhook",
   "versions_input_kind": "package.json",
   "expected": "caret ranges (^5.2.0, ^23.0.0) are not reported as exact; either resolved conservatively or flagged as unknown",
   "observed": "overall compatible, format package.json: express compatible (tested 5.3.0, yours ^5.2.0); stripe exact (tested 23.0.0, yours ^23.0.0)",
   "correct": false
  },
  {
   "check_id": "V21",
   "tool": "search_recipes",
   "recipe_id": null,
   "versions_input_kind": "map",
   "expected": "express-stripe-webhook ranks first and results carry a compatibility summary",
   "observed": "with versions: express-stripe-webhook (117.95, exact), fastapi-stripe-webhook (101.95, mismatch), nextjs-stripe-webhook (80.95, exact), stripe-checkout-mocked-http (67.34, exact) | same query without versions: express-stripe-webhook (105.95), fastapi-stripe-webhook (105.95), nextjs-stripe-webhook (74.95), stripe-checkout-mocked-http (61.34)",
   "correct": true
  },
  {
   "check_id": "V22",
   "tool": "search_recipes",
   "recipe_id": null,
   "versions_input_kind": "requirements.txt",
   "expected": "fastapi-stripe-webhook ranks first (matches the Python versions)",
   "observed": "with versions: fastapi-stripe-webhook (121.95, compatible), express-stripe-webhook (101.95, mismatch), nextjs-stripe-webhook (70.95, mismatch), stripe-checkout-mocked-http (57.34, mismatch) | same query without versions: express-stripe-webhook (105.95), fastapi-stripe-webhook (105.95), nextjs-stripe-webhook (74.95), stripe-checkout-mocked-http (61.34)",
   "correct": true
  },
  {
   "check_id": "V23",
   "tool": "search_recipes",
   "recipe_id": null,
   "versions_input_kind": "map",
   "expected": "recipes pinning better-sqlite3 13.0.3 (hono-drizzle-sqlite-api) rank above those pinning 12.11.1 (drizzle-sqlite-crud, drizzle-zod-insert-schemas), unlike the unfiltered order",
   "observed": "with versions: drizzle-sqlite-crud (124.64, mismatch), hono-drizzle-sqlite-api (104.39, exact), drizzle-zod-insert-schemas (94.05, mismatch), drizzle-pglite-postgres (85.83, exact) | same query without versions: drizzle-sqlite-crud (122.64), hono-drizzle-sqlite-api (92.39), drizzle-zod-insert-schemas (92.05), drizzle-pglite-postgres (79.83)",
   "correct": false
  },
  {
   "check_id": "V24",
   "tool": "get_recipe",
   "recipe_id": "express-stripe-webhook",
   "versions_input_kind": "malformed",
   "expected": "clear, polite error (or explicit 'could not parse' note), no crash",
   "observed": "isError, status 200: versions looks like JSON but could not be parsed.",
   "correct": true
  },
  {
   "check_id": "V25",
   "tool": "get_recipe",
   "recipe_id": "express-stripe-webhook",
   "versions_input_kind": "malformed",
   "expected": "clear error or a note that versions were ignored, no crash",
   "observed": "overall unknown, format requirements.txt: express not_in_project (tested 5.3.0, yours None); stripe not_in_project (tested 23.0.0, yours None)",
   "correct": false
  },
  {
   "check_id": "V26",
   "tool": "get_recipe",
   "recipe_id": "express-stripe-webhook",
   "versions_input_kind": "malformed",
   "expected": "schema validation error (versions must be object or string), no crash",
   "observed": "isError, status 200: versions must be an object like {\"zod\": \"3.23.8\"} or the text of a lockfile or manifest.",
   "correct": true
  },
  {
   "check_id": "V27",
   "tool": "search_recipes",
   "recipe_id": null,
   "versions_input_kind": "malformed",
   "expected": "schema validation error for an array, no crash",
   "observed": "isError, status 200: versions must be an object like {\"zod\": \"3.23.8\"} or the text of a lockfile or manifest.",
   "correct": true
  },
  {
   "check_id": "V28",
   "tool": "get_recipe",
   "recipe_id": "fastapi-stripe-webhook",
   "versions_input_kind": "requirements.txt",
   "expected": "input over the documented 200KB limit gets a clear size error or an explicit truncation note, no crash",
   "observed": "isError, status 200: versions is too large (max 200KB). Pass a {package: version} map or just the relevant part of the lockfile.",
   "correct": true
  }
 ],
 "failures": [
  {
   "failure_id": "F01",
   "task_id": "T016",
   "severity": "minor",
   "type": "search_miss",
   "tool": "search_recipes",
   "arguments": {
    "query": "OpenAI Python SDK structured outputs parsed into a Pydantic model"
   },
   "response_excerpt": "#1 openai-python-respx-mock (python, score 133.32): OpenAI Python SDK structured outputs, tested with respx | #2 openai-structured-output-respx (python, score 120.15): OpenAI chat.completions.parse with Pydantic output + respx mocks | #3 openai-sdk-mocked-tool-calls (typescript, score 78.63): OpenAI Node SDK tool calling + Zod, tested with a mocked fetch",
   "expected": "a fitting recipe at rank 1: openai-structured-output-respx",
   "observed": "top1 is not fitting (a fitting recipe is in the top 3): #2 openai-structured-output-respx uses chat.completions.parse with a Pydantic response_format (fits); top1 validates JSON output with Pydantic, which may not use the parse helper (verify)"
  },
  {
   "failure_id": "F02",
   "task_id": "T042",
   "severity": "minor",
   "type": "search_miss",
   "tool": "search_recipes",
   "arguments": {
    "query": "SQLAlchemy 1.4 to 2.0: replace session.query() with select() and use Mapped[] typed models"
   },
   "response_excerpt": "#1 sqlmodel-sqlalchemy-core-select (python, score 65.02): SQLModel tables queried with SQLAlchemy Core select on sqlite | #2 sqlalchemy-hybrid-events (python, score 64.4): SQLAlchemy 2.0 hybrid properties, column_property and before_flush audit events | #3 flask-migrate-sqlite (python, score 55.42): Flask-SQLAlchemy models with Flask-Migrate upgrades on sqlite in tests",
   "expected": "a fitting recipe at rank 1: sqlalchemy-hybrid-events",
   "observed": "top1 is not fitting (a fitting recipe is in the top 3): code: sqlalchemy-hybrid-events uses DeclarativeBase/Mapped/mapped_column with select()+session.scalars(); rank-4 factory-boy recipe not fetched, so not counted; top1 is SQLModel + Core select"
  },
  {
   "failure_id": "F03",
   "task_id": "T045",
   "severity": "minor",
   "type": "search_miss",
   "tool": "search_recipes",
   "arguments": {
    "query": "PyJWT 2 upgrade: jwt.decode now requires algorithms and jwt.encode returns str instead of bytes"
   },
   "response_excerpt": "#1 returns-maybe-ioresult (python, score 68.43): returns Maybe and IOResult railway composition with map and bind | #2 fastapi-oauth2-pyjwt-scopes (python, score 66.35): FastAPI OAuth2 password flow with PyJWT tokens and scope checks | #3 pyjwt-cryptography-rs256 (python, score 66.35): RS256 JWTs with PyJWT and cryptography-generated keys",
   "expected": "a fitting recipe at rank 1: fastapi-jwt-auth, fastapi-oauth2-pyjwt-scopes, pyjwt-cryptography-rs256",
   "observed": "top1 is not fitting (a fitting recipe is in the top 3): top1 is the returns library (Maybe/IOResult): the word returns in the query matched a library name. #2-#4 are PyJWT 2.15.1 recipes with explicit algorithms (pyjwt-cryptography-rs256 enforces algorithm)"
  },
  {
   "failure_id": "F04",
   "task_id": "T049",
   "severity": "minor",
   "type": "search_miss",
   "tool": "search_recipes",
   "arguments": {
    "query": "marshmallow 4 upgrade: missing= and default= removed, use load_default and dump_default, and Schema.context removed"
   },
   "response_excerpt": "#1 marshmallow-dataclass-schema (python, score 87.81): marshmallow-dataclass schemas: nested load, dump and validation | #2 flask-marshmallow-webargs (python, score 63.47): Flask API args parsed and validated with webargs and marshmallow | #3 marshmallow-sqlalchemy-flask-api (python, score 58.75): Flask API with Flask-SQLAlchemy and marshmallow-sqlalchemy, validation errors as 422",
   "expected": "a fitting recipe at rank 1: flask-marshmallow-webargs",
   "observed": "top1 is not fitting (a fitting recipe is in the top 3): code: flask-marshmallow-webargs (rank 2) uses fields.*(load_default=...) on marshmallow 4.3.1 and no Schema.context; top1 marshmallow-dataclass-schema shows neither"
  },
  {
   "failure_id": "F05",
   "task_id": "T051",
   "severity": "major",
   "type": "search_miss",
   "tool": "search_recipes",
   "arguments": {
    "query": "zod v3 to v4 migration: z.string().email() deprecated, message param renamed to error, error.flatten() and format() replaced, z.record needs a key schema"
   },
   "response_excerpt": "#1 zod-v4-json-schema-export (typescript, score 80.99): Zod v4 schemas exported to JSON Schema and checked with Ajv | #2 ws-zod-message-protocol (typescript, score 51.5): ws WebSocket server with a Zod-validated message protocol | #3 zod-to-openapi-document-generation (typescript, score 51.24): Zod 4 schemas to an OpenAPI 3.1 document with zod-to-openapi",
   "expected": "a fitting recipe in the top 3: nestjs-zod-validation-pipe, express-zod-validation",
   "observed": "code: nestjs-zod-validation-pipe (rank 5) and express-zod-validation (not in top 10) use z.email() and z.flattenError (2 of the 3 named zod 4 changes); no zod recipe uses the error param; top1 zod-v4-json-schema-export has only z.email()"
  },
  {
   "failure_id": "F06",
   "task_id": "T067",
   "severity": "minor",
   "type": "search_miss",
   "tool": "search_recipes",
   "arguments": {
    "query": "how parse yaml config file + validate with pydantic and let env vars override values??"
   },
   "response_excerpt": "#1 pydantic-settings-config (python, score 81.11): Pydantic Settings typed config from env and .env | #2 pydantic-settings-yaml-secrets (python, score 73.55): pydantic-settings v2 config from env, YAML and defaults with SecretStr | #3 js-yaml-zod-config (typescript, score 66.21): js-yaml 5 config files validated with Zod 4",
   "expected": "a fitting recipe at rank 1: pydantic-settings-yaml-secrets",
   "observed": "top1 is not fitting (a fitting recipe is in the top 3): #2 pydantic-settings-yaml-secrets loads YAML+env with env above YAML (fits); top1 pydantic-settings-config covers env/.env but no YAML"
  },
  {
   "failure_id": "F07",
   "task_id": "T004",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "Celery task with automatic retries and exponential backoff using Redis broker"
   },
   "response_excerpt": "count 10; #1 celery-redis-fakeredis-results (python, score 138.68): Celery 5 on Redis with fakeredis-backed idempotency, tested offline in eager mode",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 celery-redis-fakeredis-results configures Celery on a Redis broker but is about an idempotency lock; no result mentions autoretry/retry_backoff/self.retry"
  },
  {
   "failure_id": "F08",
   "task_id": "T015",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "Django REST Framework ModelViewSet with token authentication"
   },
   "response_excerpt": "count 10; #1 django-drf-api (python, score 98.93): Django 6 + Django REST Framework model API with pytest-django",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 django-drf-api has ModelViewSet+router+serializer but its summary says token-free permissions; #3 drf-simplejwt is JWT not DRF TokenAuthentication; core token-auth requirement missing"
  },
  {
   "failure_id": "F09",
   "task_id": "T017",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "Anthropic Python SDK tool use loop with tool input schema from a Pydantic model"
   },
   "response_excerpt": "count 10; #1 anthropic-sdk-mocked-tool-use (typescript, score 100.25): Anthropic TypeScript SDK tool use loop, tested with a mocked fetch",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 is the Anthropic TypeScript SDK tool-use loop (same topic, wrong language) for a Python query; no Python anthropic recipe in s2; stack [anthropic,pydantic] returns 0"
  },
  {
   "failure_id": "F10",
   "task_id": "T019",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "OpenTelemetry tracing for FastAPI with console or in-memory span exporter"
   },
   "response_excerpt": "count 10; #1 opentelemetry-sdk-inmemory-span (python, score 114.74): OpenTelemetry SDK spans captured with InMemorySpanExporter",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 opentelemetry-sdk-inmemory-span sets up the SDK with InMemorySpanExporter but has no FastAPI app or instrumentation; stack filter 0"
  },
  {
   "failure_id": "F11",
   "task_id": "T024",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "Drizzle ORM with better-sqlite3 schema, migrations and relational queries"
   },
   "response_excerpt": "count 10; #1 drizzle-sqlite-crud (typescript, score 145.2): Drizzle ORM + better-sqlite3 CRUD",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 drizzle-sqlite-crud is drizzle+better-sqlite3 but explicitly migrations-free; the migrations recipe (#4) is PGlite/Postgres, not better-sqlite3"
  },
  {
   "failure_id": "F12",
   "task_id": "T027",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "BullMQ queue and worker with retries and exponential backoff"
   },
   "response_excerpt": "count 10; #1 p-queue-concurrency (typescript, score 35.46): p-queue bounded concurrency",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: no BullMQ recipe (stack filter 0); top1 p-queue-concurrency is an in-process queue that looks like a job-queue answer but is not Redis-backed BullMQ with retries"
  },
  {
   "failure_id": "F13",
   "task_id": "T033",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "OpenAI Node SDK structured outputs with a zod schema"
   },
   "response_excerpt": "count 10; #1 openai-sdk-mocked-tool-calls (typescript, score 119.36): OpenAI Node SDK tool calling + Zod, tested with a mocked fetch",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 openai-sdk-mocked-tool-calls is Node SDK + zod but for tool-call arguments, not structured outputs with zodResponseFormat; #2/#3 are Python structured-output recipes; s2 adds zod JSON Schema export and the Vercel AI SDK"
  },
  {
   "failure_id": "F14",
   "task_id": "T034",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "stream LLM chat responses from a Next.js route handler using the Vercel AI SDK"
   },
   "response_excerpt": "count 10; #1 nextjs-route-handler-zod (typescript, score 94.2): Next.js 16 App Router route handler + Zod validation",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 is a Next.js 16 route handler with Zod (no AI SDK); #4 vercel-ai-sdk-mock-model-tools covers streamText with a mock model but not a Next.js route returning the stream; stack [ai,@ai-sdk/openai] returns 0"
  },
  {
   "failure_id": "F15",
   "task_id": "T036",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "Express and Mongoose REST API with schema validation and pagination"
   },
   "response_excerpt": "count 10; #1 joi-express-validation (typescript, score 74.24): Joi request validation middleware for Express 5",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: no Mongoose recipe (stack filter 0); top1 joi-express-validation answers schema validation with Joi request validation instead of Mongoose model validators, with no persistence or pagination"
  },
  {
   "failure_id": "F16",
   "task_id": "T037",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "Node CLI with commander subcommands and interactive prompts using @inquirer/prompts"
   },
   "response_excerpt": "count 10; #1 commander-zod-cli (typescript, score 99.81): Commander CLI with Zod option validation, tested in-process",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 commander-zod-cli covers commander 15 subcommands but no interactive @inquirer/prompts; stack filter 0"
  },
  {
   "failure_id": "F17",
   "task_id": "T040",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "fetch 100 API items with max 5 concurrent requests and retry failures with p-retry"
   },
   "response_excerpt": "count 10; #1 undici-mockagent-p-retry (typescript, score 86.17): undici HTTP client with p-retry backoff, tested with MockAgent",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 undici-mockagent-p-retry shows p-retry 8.0.1 with AbortError but no concurrency cap; #4 p-limit-concurrency shows p-limit alone; no recipe combines them (stack filter 0)"
  },
  {
   "failure_id": "F18",
   "task_id": "T050",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "NumPy 2.0 removed np.float_, np.NaN and np.Inf: fix AttributeError after upgrading"
   },
   "response_excerpt": "count 10; #1 numpy-scipy-optimize-fit (python, score 69.8): NumPy + SciPy curve_fit and bounded minimize, tested with seeded noise",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 numpy-scipy-optimize-fit pins numpy 2.5.4 but is a curve-fitting recipe; nothing about the removed np.float_/np.NaN/np.Inf aliases"
  },
  {
   "failure_id": "F19",
   "task_id": "T055",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "Fastify v4 to v5 migration: full JSON schema required for querystring and params, reply.redirect argument order changed, listen needs an options object"
   },
   "response_excerpt": "count 10; #1 fastify-swagger-openapi (typescript, score 75.87): Fastify 5 OpenAPI docs generated with @fastify/swagger",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: results are Fastify 5.12.7 recipes (swagger, JSON schema validation, zod provider, jwt); #2 shows full JSON Schema validation but none covers the v4->v5 redirect argument order or listen options"
  },
  {
   "failure_id": "F20",
   "task_id": "T056",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "TypeORM createConnection and getRepository removed: migrate to DataSource"
   },
   "response_excerpt": "count 10; #1 nestjs-typeorm-sqlite (typescript, score 75.71): NestJS 12 + TypeORM 1 on in-memory SQLite, tested with @nestjs/testing",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 nestjs-typeorm-sqlite pins typeorm 1.1.2 but goes through @nestjs/typeorm, not new DataSource().initialize()/getRepository directly"
  },
  {
   "failure_id": "F21",
   "task_id": "T059",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "drizzle-kit config changed: driver replaced by dialect and generate:sqlite replaced by generate"
   },
   "response_excerpt": "count 10; #1 drizzle-sqlite-crud (typescript, score 103.38): Drizzle ORM + better-sqlite3 CRUD",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: no drizzle-kit config recipe (stack filter 0); top1 drizzle-sqlite-crud is migrations-free"
  },
  {
   "failure_id": "F22",
   "task_id": "T062",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "celery task just hangs forever no error, redis broker... also how do i retry when the external api is down"
   },
   "response_excerpt": "count 10; #1 celery-redis-fakeredis-results (python, score 135.82): Celery 5 on Redis with fakeredis-backed idempotency, tested offline in eager mode",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 celery-redis-fakeredis-results configures Celery on Redis but shows an idempotency lock, not retries/backoff or time limits/visibility settings for hanging tasks"
  },
  {
   "failure_id": "F23",
   "task_id": "T066",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "upload big csv to s3 in chunks python without loading whole file into memory"
   },
   "response_excerpt": "count 10; #1 csv-parse-stringify-streams (typescript, score 51.49): Streaming CSV transform with csv-parse + csv-stringify",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: s1 top1 is TypeScript csv-parse streaming (same memory concern, wrong language, no S3); s2 boto3-moto-s3-presigned does uploads/listing/presign but no multipart or streaming upload"
  },
  {
   "failure_id": "F24",
   "task_id": "T068",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "logging json for fastapi w request id in every line, uvicorn access logs too pls"
   },
   "response_excerpt": "count 10; #1 structlog-fastapi-request-id (python, score 96.49): FastAPI request ids in structlog contextvars, tested with capture_logs",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 structlog-fastapi-request-id covers JSON logs with a request id but nothing about routing uvicorn access logs through the same formatter"
  },
  {
   "failure_id": "F25",
   "task_id": "T070",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "jwt token expired error handling + refresh token flow in fastapi pls, getting 500 instead of 401"
   },
   "response_excerpt": "count 10; #1 fastapi-jwt-auth (python, score 70.25): FastAPI + PyJWT bearer auth",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 fastapi-jwt-auth is FastAPI+PyJWT bearer auth but its summary has no refresh tokens or expired-token 401 handling; the only refresh-token recipe shown is Flask"
  },
  {
   "failure_id": "F26",
   "task_id": "T071",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "jwt verify keeps saying invalid signature in node even tho secret is right, also how do refresh tokens"
   },
   "response_excerpt": "count 10; #1 flask-jwt-extended-auth (python, score 54.76): Flask 3 + Flask-JWT-Extended access and refresh tokens",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: s1 top1 is a Python Flask-JWT-Extended refresh-token recipe (same topic, wrong language) for a Node query; Express+jsonwebtoken recipes exist (passport-jwt, express-jwt-auth) but none shows refresh tokens"
  },
  {
   "failure_id": "F27",
   "task_id": "T072",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "axios retry 3 times w backoff but only on 503 and dont go over api limit of 10 req/sec"
   },
   "response_excerpt": "count 10; #1 axios-retry-nock (typescript, score 140.03): Axios + axios-retry with exponential backoff, tested with nock",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 axios-retry-nock covers axios-retry backoff (429/5xx, easy to narrow to 503) but no request-rate limiter; no bottleneck+axios recipe in results"
  },
  {
   "failure_id": "F28",
   "task_id": "T075",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "express 5 crashes on startup TypeError: Missing parameter name at 1 path-to-regexp"
   },
   "response_excerpt": "count 10; #1 express5-async-error-handling (typescript, score 67.31): express 5 async error handling",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 express5-async-error-handling is Express 5.3.0 but about async errors; nothing shows v5 path syntax (named wildcards) that fixes the path-to-regexp crash"
  },
  {
   "failure_id": "F29",
   "task_id": "T076",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "prisma too many connections on vercel serverless, connection pool exhausted what do"
   },
   "response_excerpt": "count 10; #1 prisma-sqlite-adapter (typescript, score 69.77): Prisma 7 + SQLite via better-sqlite3 adapter",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 prisma-sqlite-adapter is Prisma 7 with a SQLite driver adapter; nothing on a client singleton or serverless Postgres pooling (connection_limit, pgbouncer, Accelerate)"
  },
  {
   "failure_id": "F30",
   "task_id": "T078",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "drizzle migrate sqlite how?? kit generate doesnt do anything"
   },
   "response_excerpt": "count 10; #1 drizzle-sqlite-crud (typescript, score 102.67): Drizzle ORM + better-sqlite3 CRUD",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 drizzle-sqlite-crud is drizzle+better-sqlite3 but explicitly migrations-free table creation; nothing shows drizzle-kit generate or migrate(); stack filter with drizzle-kit returns 0 (relabelled partial for consistency with T059)"
  },
  {
   "failure_id": "F31",
   "task_id": "T079",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "openai streaming response in express and send it to the browser as SSE chunks"
   },
   "response_excerpt": "count 10; #1 openai-streaming-mock (typescript, score 106.72): OpenAI Node SDK streaming chat completions, tested with a mocked SSE fetch",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 openai-streaming-mock covers Node SDK streaming and aborts but not Express or SSE output; stack [openai,express] returns 0"
  },
  {
   "failure_id": "F32",
   "task_id": "T085",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "generate PDF invoice from an HTML Jinja2 template with WeasyPrint"
   },
   "response_excerpt": "count 10; #1 jinja2-markupsafe-email-templates (python, score 64.6): Jinja2 sandboxed email templates with autoescape and custom filters",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: no WeasyPrint recipe (stack filter 0); top1 Jinja2 email templates covers only the templating half; #4 is TypeScript pdf-lib"
  },
  {
   "failure_id": "F33",
   "task_id": "T088",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "implement an LRU cache from scratch in Python without functools or any library, O(1) get and put"
   },
   "response_excerpt": "count 10; #1 lru-cache-ttl (typescript, score 100.98): lru-cache TTL eviction and size limits",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: trap task: top1 is the TypeScript lru-cache library; s2 top1 is diskcache+cachetools; both are library-based caches that the task excludes"
  },
  {
   "failure_id": "F34",
   "task_id": "T090",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "Litestar app with msgspec Struct request bodies and dependency injection"
   },
   "response_excerpt": "count 10; #1 litestar-guards-di (python, score 109.3): Litestar app with DI, role guards and exception handlers",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: code: litestar-guards-di has Provide-based DI but no request bodies and no msgspec Structs at all; no Litestar+msgspec recipe in the index"
  },
  {
   "failure_id": "F35",
   "task_id": "T091",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "Effect-TS: decode input with Schema, typed tagged errors, and provide a service via Layer"
   },
   "response_excerpt": "count 10; #1 effect-schema-vitest (typescript, score 103.91): Effect 4 Schema classes, typed errors and retries, tested with @effect/vitest",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 effect-schema-vitest (effect 4.0.5) covers Schema decoding and TaggedError but its summary has no service tag or Layer, a core part of the task"
  },
  {
   "failure_id": "F36",
   "task_id": "T092",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "Bun.serve websocket server with pub/sub topics"
   },
   "response_excerpt": "count 10; #1 ws-zod-message-protocol (typescript, score 21.61): ws WebSocket server with a Zod-validated message protocol",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: no Bun recipe; top1 ws-zod-message-protocol is a Node ws room-chat server: same topic (websocket rooms) but not Bun.serve pub/sub"
  },
  {
   "failure_id": "F37",
   "task_id": "T094",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "rate limiter using a Cloudflare Durable Object in a Worker"
   },
   "response_excerpt": "count 10; #1 rate-limiter-flexible-memory (typescript, score 66.08): rate-limiter-flexible in-memory limiters",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: no Cloudflare Workers/Durable Object recipe; top1 rate-limiter-flexible in-memory matches the rate-limit topic but cannot work as a Durable Object"
  },
  {
   "failure_id": "F38",
   "task_id": "T095",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "Temporal TypeScript SDK workflow with signals and queries"
   },
   "response_excerpt": "count 10; #1 temporal-polyfill-dates (typescript, score 47.88): Temporal polyfill PlainDate and Duration",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: name collision: top1 is the JS Temporal date polyfill, not the Temporal workflow SDK; no @temporalio recipe (stack filter 0)"
  },
  {
   "failure_id": "F39",
   "task_id": "T098",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "generate JSON Schema from existing TypeScript interfaces at build time, not from zod schemas"
   },
   "response_excerpt": "count 10; #1 json-schema-to-typescript-codegen (typescript, score 84.88): Generate TypeScript types from JSON Schema with json-schema-to-typescript",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: top1 json-schema-to-typescript goes the opposite direction (JSON Schema -> TS types); #2 is zod z.toJSONSchema which the task excludes; no ts-json-schema-generator recipe (stack filter 0)"
  },
  {
   "failure_id": "F40",
   "task_id": "T099",
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "Stripe Terminal React Native: discover and connect a Bluetooth card reader and collect a payment"
   },
   "response_excerpt": "count 10; #1 fastapi-stripe-webhook (python, score 76.21): FastAPI + Stripe webhook signature verification",
   "expected": "count 0 (no fitting recipe exists in the index) or a clearly unrelated result",
   "observed": "misleading top result: trap task: top results are Stripe webhook recipes (FastAPI, Express, Next.js), which look relevant by name but do nothing for Terminal reader discovery/collection"
  },
  {
   "failure_id": "F41",
   "task_id": null,
   "severity": "major",
   "type": "false_match",
   "tool": "search_recipes",
   "arguments": {
    "query": "<each of the uncovered task queries>"
   },
   "response_excerpt": "result counts on the 55 uncovered tasks: [10]",
   "expected": "count 0 for at least some uncovered tasks (honest no-match), as the tool description promises ('If nothing matches, write the code yourself')",
   "observed": "none of the 100 unfiltered task queries returned count 0: on all 55 uncovered tasks the server returned 10 results (34 misleading top results, listed above; 21 unrelated: T020, T048, T053, T054, T057, T058, T065, T074, T077, T080, T081, T082, T083, T084, T086, T087, T089, T093, T096, T097, T100). count 0 did occur with a stack filter (37 of my 97 stack-filtered searches) and for some short keyword queries without a stack filter made by arm agents ([{\"query\": \"SettingWithCopyWarning\", \"language\": \"python\"}, {\"query\": \"SettingWithCopyWarning\", \"language\": \"python\"}, {\"query\": \"sudoku\", \"language\": \"python\"}, {\"query\": \"ortools\"}, {\"query\": \"sudoku\", \"language\": \"python\"}, {\"query\": \"ortools\"}, {\"query\": \"constraint programming solver\", \"language\": \"python\"}, {\"query\": \"SettingWithCopyWarning\", \"language\": \"python\"}, {\"query\": \"sudoku\", \"language\": \"python\"}, {\"query\": \"ortools\"}]), so the server can return zero; it did not for any descriptive task query. The top1 score ranges overlap (fitting top1 35-227, misleading 22-145, unrelated 14-126), so a client cannot use the score as a cutoff."
  },
  {
   "failure_id": "F42",
   "task_id": null,
   "severity": "major",
   "type": "broken_recipe",
   "tool": "get_recipe",
   "arguments": {
    "id": "ky-msw-vitest"
   },
   "response_excerpt": "setup: \"npm install --no-audit --no-fund --ignore-scripts=false\"; receipt.environment.runtime: \"node v22.23.3\" (no npm version given). My run of that setup on Node v22.22.0 with its bundled npm 10.9.4: \"npm error Cannot read properties of null (reading 'edgesOut')\", exit 1.",
   "expected": "the published setup command installs on the stated runtime (Node 22)",
   "observed": "8 of 99 TypeScript recipes (aws-sdk-v3-dynamodb-sqs-vitest, effect-schema-vitest, hono-drizzle-sqlite-api, jose-jwks-verify, jotai-atoms-react-testing-library, ky-msw-vitest, redux-toolkit-rtk-query-msw, trpc-client-server-superjson) crash in npm install with npm 10.9.4, the npm that ships with Node 22. All 8 pass (test counts equal the receipts) when the same setup runs through npx npm@11.6.0. ProvenPin's own runner (runner/lib.mjs, rewriteSetup in the public repo) quietly switches to npm 11.6.0 when npm is older than 11.6, but the served setup command and receipt do not mention it. Classed as an undisclosed environment requirement, not broken recipe code. Evidence: recipes/<id>/run.log and retry_npm116.log."
  },
  {
   "failure_id": "F43",
   "task_id": null,
   "severity": "minor",
   "type": "other",
   "tool": "get_recipe",
   "arguments": {
    "id": "<any of the 194 fetched recipes>"
   },
   "response_excerpt": "receipt.files lists \"recipes/<id>/recipe.yaml\": \"sha256:...\", but files[] has no recipe.yaml entry",
   "expected": "every file whose hash is in the receipt is served, so a client can recompute receipt.recipe_hash from the response alone",
   "observed": "all 194 receipts list a recipe.yaml that get_recipe does not serve. Every served file's sha256 matched (194/194), but recipe_hash could only be recomputed with recipe.yaml from the public git repo (an anonymous clone). Using only the MCP response, the receipt cannot be checked end to end."
  },
  {
   "failure_id": "F44",
   "task_id": null,
   "severity": "minor",
   "type": "other",
   "tool": "get_recipe",
   "arguments": {
    "id": "nestjs-typeorm-sqlite"
   },
   "response_excerpt": "get_recipe response has no staleness field; receipts.json for the same recipe has staleness \"breaks_on_latest\"",
   "expected": "an agent reading a recipe through MCP is told when it is known to break on the latest library versions, or when staleness was never checked",
   "observed": "receipts.json (generated 2026-10-18T03:59:18Z) carries a staleness status, but neither search_recipes nor get_recipe shows it. In receipts.json 406 of 555 recipes (73%) are 'unchecked', 137 'current', 9 'passes_on_latest' and 3 'breaks_on_latest'. Among the 194 recipes I fetched: 100 unchecked, 87 current, 6 passes_on_latest, 1 breaks_on_latest (nestjs-typeorm-sqlite, still returned by search with no warning)."
  },
  {
   "failure_id": "F45",
   "task_id": null,
   "severity": "minor",
   "type": "other",
   "tool": "get_recipe",
   "arguments": {
    "id": "<listed recipes>"
   },
   "response_excerpt": "title/summary text of each recipe (recipes/<id>/recipe.json)",
   "expected": "a recipe's title and summary claim only behaviour its code and tests show",
   "observed": "4 read-only reviewer subagents read every file of the 194 recipes. They found about 20 recipes whose title or summary claims more than the code or tests show, for example: fastapi-sqlalchemy-crud ('CRUD', but only create and read endpoints); cache-manager-memory-store ('wrap loaders', but cache.wrap is never used); js-yaml-zod-config (says unknown keys are rejected, but z.object strips them; 'env defaults' are not implemented); nestjs-zod-validation-pipe (says tested through @nestjs/testing, which is never used); openai-python-respx-mock (title says structured outputs, but the code uses JSON mode); express-stripe-webhook ('dispatch on event type', but there is no per-type routing); drizzle-pglite-postgres ('relations', but no relations() API); kysely-sqlite-queries ('schema migration', but no Migrator); p-map-concurrency-limit ('async iterator', but the input is a plain array); openai-streaming-mock ('handle aborts', but no mid-stream abort is tested); jinja2-sandboxed-user-templates ('hardened', with incomplete resource limits); express-openapi-validator-spec (response validation never tested); fastapi-pydantic-v2-models ('response_model filtering', but nothing is filtered); arktype-schema-validation ('narrow predicates', but no .narrow()); celery-tasks-eager-testing ('in-memory broker', but the broker is bypassed); nextjs-stripe-webhook and nextjs-server-action-zod (Next.js installed but never exercised). Full verbatim lists: recipes/_review_group1..4.txt. The tests that do exist pass."
  },
  {
   "failure_id": "F46",
   "task_id": null,
   "severity": "major",
   "type": "version_check",
   "tool": "search_recipes",
   "arguments": {
    "query": "drizzle orm sqlite",
    "versions": {
     "drizzle-orm": "0.45.4",
     "better-sqlite3": "13.0.3"
    }
   },
   "response_excerpt": "#1 drizzle-sqlite-crud score 124.64, compatibility overall 'mismatch' (better-sqlite3 tested 12.11.1, yours 13.0.3); #2 hono-drizzle-sqlite-api score 104.39, overall 'exact'. Without versions: 122.64 and 92.39.",
   "expected": "the search_recipes description: 'recipes that match the installed versions rank first'; hono-drizzle-sqlite-api (exact) should rank above drizzle-sqlite-crud (mismatch)",
   "observed": "a matching versions map adds a small score bonus (+12 for the exact recipe, +2 for the mismatching one), so a recipe whose pins conflict with the project still ranks first. The compatibility summary on each result shows the mismatch, so an agent that reads it is warned; the ranking alone does not deliver the promise. Checks V21 and V22 did move the matching recipe from a tie to first. (check V23)"
  },
  {
   "failure_id": "F47",
   "task_id": null,
   "severity": "minor",
   "type": "version_check",
   "tool": "get_recipe",
   "arguments": {
    "id": "express-stripe-webhook",
    "versions": "<package.json with \"express\": \"^5.2.0\", \"stripe\": \"^23.0.0\">"
   },
   "response_excerpt": "stripe: tested 23.0.0, yours '^23.0.0', verdict 'exact'; express: yours '^5.2.0', verdict 'compatible'",
   "expected": "a semver range in package.json is not reported as an exact match (it can resolve to any 23.x); flag it as a range, or resolve it conservatively",
   "observed": "ranges are stripped of the caret and compared as if they were installed versions; '^23.0.0' becomes 'exact'. package.json without a lockfile is a supported input format, so this case is common. (check V20)"
  },
  {
   "failure_id": "F48",
   "task_id": null,
   "severity": "minor",
   "type": "version_check",
   "tool": "get_recipe",
   "arguments": {
    "id": "express-stripe-webhook",
    "versions": ""
   },
   "response_excerpt": "compatibility: overall 'unknown', detected_format 'requirements.txt', express and stripe not_in_project with 'Install express@5.3.0 to match the tested setup.'",
   "expected": "a clear error, or a note that the empty versions input was ignored",
   "observed": "an empty string is accepted, labelled requirements.txt, and every package is reported as missing from the project, which is confusing rather than wrong in a harmful way. Invalid JSON (V24), a number (V26), an array (V27) and an input over 200KB (V28) all got clear, polite errors. (check V25)"
  },
  {
   "failure_id": "F49",
   "task_id": null,
   "severity": "minor",
   "type": "version_check",
   "tool": "get_recipe",
   "arguments": {
    "id": "fastapi-stripe-webhook",
    "versions": {
     "fastapi": "0.144.0",
     "stripe": "16.0.0",
     "httpx": "0.28.1"
    }
   },
   "response_excerpt": "pinned: {fastapi 0.143.1, stripe 16.0.0, httpx 0.28.1, pytest 9.1.1}; compatibility.packages: fastapi, stripe, httpx only",
   "expected": "get_recipe's description: 'comparing each pinned package with the installed one (exact, compatible, mismatch, or not in your project)', so pytest would be not_in_project",
   "observed": "test and dev pins are never compared (pytest in Python recipes; tsx, @types/*, supertest in express-stripe-webhook). This is probably deliberate, but it is undocumented, and an agent is not told that the recipe's tests need pytest 9.1.1 or tsx 4.23.15. All the verdicts that were reported were correct. (checks V10, V14, V16, which I count as incorrect because their pre-registered expectations included the pytest verdict)"
  },
  {
   "failure_id": "F50",
   "task_id": null,
   "severity": "minor",
   "type": "docs",
   "tool": null,
   "arguments": {
    "url": "https://provenpin.com/docs/"
   },
   "response_excerpt": "\"Each package gets a verdict (exact, compatible, mismatch or not in project) with a plain warning, and recipes that match your versions rank first.\"",
   "expected": "documented behaviour matches what the server does",
   "observed": "not every pinned package gets a verdict (test/dev pins are skipped), a caret range is called 'exact', and in V23 a mismatching recipe ranked first. See the version_check failures."
  },
  {
   "failure_id": "F51",
   "task_id": null,
   "severity": "minor",
   "type": "docs",
   "tool": null,
   "arguments": {
    "url": "https://provenpin.com/docs/"
   },
   "response_excerpt": "\"It also carries recipe_hash, one sha256 over the exact recipe files that were tested ... comparing hashes against your copy happens on your side.\"",
   "expected": "enough detail to recompute recipe_hash from what get_recipe returns",
   "observed": "the hash construction is not documented, and it covers recipe.yaml, which get_recipe does not serve. I could verify recipe_hash only by reading the runner source and cloning the repo. The page also omits staleness, the forced --ignore-scripts=false, the npm >= 11.6 requirement of 8 recipes, and how to recognize a 'no match' search result."
  }
 ],
 "safety_flags": [
  {
   "flag_id": "S01",
   "recipe_id": "aiohttp-pytest-plugin-client",
   "where": "conftest.py:18-25 (autouse session fixture)",
   "description": "Test fixture issues a privileged SIOCSIFFLAGS ioctl to bring the host 'lo' interface up when it is down: it changes the machine's network configuration outside the project, the change outlives the tests, and OSError is swallowed silently. Read before running; in this container lo was already UP (flags 0x9), so the write path could not trigger and the recipe was run (recipes/aiohttp-pytest-plugin-client/RUN_DECISION.txt).",
   "severity": "major"
  },
  {
   "flag_id": "S02",
   "recipe_id": null,
   "where": "setup command of 97 of the 99 TypeScript recipes fetched",
   "description": "setup is 'npm install --no-audit --no-fund --ignore-scripts=false', which forces dependency lifecycle (install/postinstall) scripts to run even when the user has ignore-scripts=true configured as a safeguard. Native packages such as better-sqlite3 then download or compile binaries at install time. The other 2 (Prisma) run plain npm install plus the Prisma CLI.",
   "severity": "minor"
  },
  {
   "flag_id": "S03",
   "recipe_id": null,
   "where": "dependency manifests of all 194 recipes fetched",
   "description": "Only direct dependencies are pinned. No recipe ships a lockfile (package-lock.json, pnpm-lock.yaml, uv.lock) or hashed requirements, so transitive versions float at install time. A future transitive release can change what gets installed, and nothing pins it to what the receipt tested. The get_recipe description promises 'the exact pinned dependency versions'; that holds for direct dependencies only. Three Python recipes also import a library they do not pin (S16).",
   "severity": "minor"
  },
  {
   "flag_id": "S04",
   "recipe_id": "prisma-sqlite-adapter",
   "where": "setup: npm install ... && npx prisma db push && npx prisma generate (also prisma-sqlite-transactions)",
   "description": "The Prisma CLI may download engine binaries and send CLI usage telemetry to Prisma servers unless CHECKPOINT_DISABLE is set. The recipe does not mention this. I set CHECKPOINT_DISABLE=1 in my runs.",
   "severity": "minor"
  },
  {
   "flag_id": "S05",
   "recipe_id": "axios-retry-nock",
   "where": "test/client.test.ts:7-8",
   "description": "nock.disableNetConnect() is never called, so unmatched requests can reach the real network. Observed (executed): on my first run, with HTTPS_PROXY set in the environment, axios sent the request to the egress proxy instead of nock, which answered 403, and the test failed. The test passed once the proxy variables were removed.",
   "severity": "minor"
  },
  {
   "flag_id": "S06",
   "recipe_id": "openai-structured-output-respx",
   "where": "tests/test_extract.py:7,18-21",
   "description": "Tests target the real api.openai.com host and rely entirely on respx interception; a code comment says the SDK's default client used to bypass respx. The API key is fake, so a leak would fail rather than bill anyone.",
   "severity": "minor"
  },
  {
   "flag_id": "S07",
   "recipe_id": "mdx-compile-evaluate",
   "where": "src/render.ts:15",
   "description": "evaluate() compiles and runs the MDX string as JavaScript, which is effectively eval and safe only for trusted content. The recipe does not warn about this.",
   "severity": "minor"
  },
  {
   "flag_id": "S08",
   "recipe_id": "jinja2-sandboxed-user-templates",
   "where": "renderer.py:28-30",
   "description": "The recipe is described as hardened, but its output cap is checked only after each chunk is rendered, and there is no time limit. One expression, such as a huge string repetition, can still exhaust memory or CPU.",
   "severity": "minor"
  },
  {
   "flag_id": "S09",
   "recipe_id": "fastapi-jinja2-htmx-partials",
   "where": "templates/base.html:5",
   "description": "Served pages load an unversioned remote script (https://unpkg.com/htmx.org) with no Subresource Integrity hash.",
   "severity": "minor"
  },
  {
   "flag_id": "S10",
   "recipe_id": "jinja2-markupsafe-email-templates",
   "where": "email_templates.py:10-12",
   "description": "The link filter escapes URLs but never checks their scheme, so javascript: hrefs get through, in a recipe tagged security.",
   "severity": "minor"
  },
  {
   "flag_id": "S11",
   "recipe_id": "ws-zod-message-protocol",
   "where": "src/server.ts:25",
   "description": "WebSocketServer({port}) listens on all interfaces, not only localhost, so the test server is reachable from the network while tests run (the summary says 'ephemeral localhost port'). No maxPayload is set.",
   "severity": "minor"
  },
  {
   "flag_id": "S12",
   "recipe_id": "express-jwt-auth",
   "where": "src/app.ts:4,22",
   "description": "When JWT_SECRET is unset the code silently falls back to a hardcoded secret, and the demo /login accepts any username with a fixed password. Similar demo-only logins appear in express-passport-jwt, fastify-jwt-auth and nestjs-jwt-guard-testing; code copied from these as-is would be insecure.",
   "severity": "minor"
  },
  {
   "flag_id": "S13",
   "recipe_id": "diskcache-cachetools-tiered",
   "where": "tiered.py:19",
   "description": "diskcache unpickles stored values, so pointing the cache at a shared or untrusted directory allows code execution. The tests use tmp_path.",
   "severity": "info"
  },
  {
   "flag_id": "S14",
   "recipe_id": "tenacity-httpx-respx-backoff",
   "where": "client.py:36-38",
   "description": "Retry-After is honoured with no upper bound, so a server can stall the client indefinitely.",
   "severity": "info"
  },
  {
   "flag_id": "S15",
   "recipe_id": "drf-django-filter-viewset",
   "where": "shop/api.py:25-30",
   "description": "The ModelViewSet has no authentication or permission classes, so anonymous users can create, update and delete records.",
   "severity": "info"
  },
  {
   "flag_id": "S16",
   "recipe_id": "sqlmodel-relationships-sqlite",
   "where": "models.py:1-2 (also fastapi-async-sqlalchemy-aiosqlite-pytest app.py:5, pydantic-settings-nested-sources config.py:1)",
   "description": "The code imports a library directly (sqlalchemy or pydantic) without pinning it, relying on another dependency to pull it in at a floating version.",
   "severity": "info"
  },
  {
   "flag_id": "S17",
   "recipe_id": "express5-async-error-handling",
   "where": "src/app.ts:25 (also koa-router-zod-supertest src/app.ts:30-31)",
   "description": "The central error handler sends the raw err.message to clients on unexpected errors, which can leak internals.",
   "severity": "info"
  },
  {
   "flag_id": "S18",
   "recipe_id": "undici-mockagent-p-retry",
   "where": "src/client.ts:17",
   "description": "new URL(path, baseUrl) lets an absolute or protocol-relative path override the host.",
   "severity": "info"
  },
  {
   "flag_id": "S19",
   "recipe_id": "fastapi-websocket-auth",
   "where": "app/main.py:4,17",
   "description": "Demo tokens are sent in the query string, so they end up in access logs.",
   "severity": "info"
  },
  {
   "flag_id": "S20",
   "recipe_id": "pino-redaction-custom-transport",
   "where": "src/logger.ts:18",
   "description": "Redact paths are case-sensitive and the wildcard covers only one level, so headers.Authorization or a nested password would not be redacted.",
   "severity": "info"
  }
 ],
 "extra": {
  "search_breakdown": {
   "all": {
    "tasks": 100,
    "covered": 45,
    "coverage_rate": {
     "value": 0.45,
     "n": 100
    },
    "top1_rate": {
     "value": 0.8667,
     "n": 45
    },
    "top3_rate": {
     "value": 0.9778,
     "n": 45
    },
    "language_filter_top1_rate": {
     "value": 0.8667,
     "n": 45
    },
    "language_filter_top3_rate": {
     "value": 0.9778,
     "n": 45
    },
    "stack_filter_top1_rate": {
     "value": 0.7778,
     "n": 45
    },
    "honest_no_match_rate": {
     "value": 0.0,
     "n": 55
    },
    "misleading_top1_on_uncovered_rate": {
     "value": 0.6182,
     "n": 55
    },
    "unrelated_top1_on_uncovered_rate": {
     "value": 0.3818,
     "n": 55
    },
    "search_misses": [
     "T051"
    ]
   },
   "by_language": {
    "python": {
     "tasks": 50,
     "covered": 28,
     "coverage_rate": {
      "value": 0.56,
      "n": 50
     },
     "top1_rate": {
      "value": 0.8214,
      "n": 28
     },
     "top3_rate": {
      "value": 1.0,
      "n": 28
     },
     "language_filter_top1_rate": {
      "value": 0.8214,
      "n": 28
     },
     "language_filter_top3_rate": {
      "value": 1.0,
      "n": 28
     },
     "stack_filter_top1_rate": {
      "value": 0.7857,
      "n": 28
     },
     "honest_no_match_rate": {
      "value": 0.0,
      "n": 22
     },
     "misleading_top1_on_uncovered_rate": {
      "value": 0.5455,
      "n": 22
     },
     "unrelated_top1_on_uncovered_rate": {
      "value": 0.4545,
      "n": 22
     },
     "search_misses": []
    },
    "typescript": {
     "tasks": 50,
     "covered": 17,
     "coverage_rate": {
      "value": 0.34,
      "n": 50
     },
     "top1_rate": {
      "value": 0.9412,
      "n": 17
     },
     "top3_rate": {
      "value": 0.9412,
      "n": 17
     },
     "language_filter_top1_rate": {
      "value": 0.9412,
      "n": 17
     },
     "language_filter_top3_rate": {
      "value": 0.9412,
      "n": 17
     },
     "stack_filter_top1_rate": {
      "value": 0.7647,
      "n": 17
     },
     "honest_no_match_rate": {
      "value": 0.0,
      "n": 33
     },
     "misleading_top1_on_uncovered_rate": {
      "value": 0.6667,
      "n": 33
     },
     "unrelated_top1_on_uncovered_rate": {
      "value": 0.3333,
      "n": 33
     },
     "search_misses": [
      "T051"
     ]
    }
   },
   "by_category": {
    "integration": {
     "tasks": 40,
     "covered": 28,
     "coverage_rate": {
      "value": 0.7,
      "n": 40
     },
     "top1_rate": {
      "value": 0.9643,
      "n": 28
     },
     "top3_rate": {
      "value": 1.0,
      "n": 28
     },
     "language_filter_top1_rate": {
      "value": 0.9643,
      "n": 28
     },
     "language_filter_top3_rate": {
      "value": 1.0,
      "n": 28
     },
     "stack_filter_top1_rate": {
      "value": 0.8571,
      "n": 28
     },
     "honest_no_match_rate": {
      "value": 0.0,
      "n": 12
     },
     "misleading_top1_on_uncovered_rate": {
      "value": 0.9167,
      "n": 12
     },
     "unrelated_top1_on_uncovered_rate": {
      "value": 0.0833,
      "n": 12
     },
     "search_misses": []
    },
    "version_gotcha": {
     "tasks": 20,
     "covered": 11,
     "coverage_rate": {
      "value": 0.55,
      "n": 20
     },
     "top1_rate": {
      "value": 0.6364,
      "n": 11
     },
     "top3_rate": {
      "value": 0.9091,
      "n": 11
     },
     "language_filter_top1_rate": {
      "value": 0.6364,
      "n": 11
     },
     "language_filter_top3_rate": {
      "value": 0.9091,
      "n": 11
     },
     "stack_filter_top1_rate": {
      "value": 0.6364,
      "n": 11
     },
     "honest_no_match_rate": {
      "value": 0.0,
      "n": 9
     },
     "misleading_top1_on_uncovered_rate": {
      "value": 0.4444,
      "n": 9
     },
     "unrelated_top1_on_uncovered_rate": {
      "value": 0.5556,
      "n": 9
     },
     "search_misses": [
      "T051"
     ]
    },
    "messy_question": {
     "tasks": 20,
     "covered": 6,
     "coverage_rate": {
      "value": 0.3,
      "n": 20
     },
     "top1_rate": {
      "value": 0.8333,
      "n": 6
     },
     "top3_rate": {
      "value": 1.0,
      "n": 6
     },
     "language_filter_top1_rate": {
      "value": 0.8333,
      "n": 6
     },
     "language_filter_top3_rate": {
      "value": 1.0,
      "n": 6
     },
     "stack_filter_top1_rate": {
      "value": 0.6667,
      "n": 6
     },
     "honest_no_match_rate": {
      "value": 0.0,
      "n": 14
     },
     "misleading_top1_on_uncovered_rate": {
      "value": 0.7143,
      "n": 14
     },
     "unrelated_top1_on_uncovered_rate": {
      "value": 0.2857,
      "n": 14
     },
     "search_misses": []
    },
    "likely_uncovered": {
     "tasks": 20,
     "covered": 0,
     "coverage_rate": {
      "value": 0.0,
      "n": 20
     },
     "top1_rate": {
      "value": null,
      "n": 0
     },
     "top3_rate": {
      "value": null,
      "n": 0
     },
     "language_filter_top1_rate": {
      "value": null,
      "n": 0
     },
     "language_filter_top3_rate": {
      "value": null,
      "n": 0
     },
     "stack_filter_top1_rate": {
      "value": null,
      "n": 0
     },
     "honest_no_match_rate": {
      "value": 0.0,
      "n": 20
     },
     "misleading_top1_on_uncovered_rate": {
      "value": 0.45,
      "n": 20
     },
     "unrelated_top1_on_uncovered_rate": {
      "value": 0.55,
      "n": 20
     },
     "search_misses": []
    }
   },
   "zero_count_searches": {
    "s1": 0,
    "s2": 0,
    "s3": 37
   },
   "top1_score_by_outcome": {
    "covered_fit": {
     "n": 39,
     "min": 35.39,
     "median": 127.9,
     "max": 226.54
    },
    "uncovered_misleading": {
     "n": 34,
     "min": 21.61,
     "median": 90.19,
     "max": 145.2
    },
    "covered_not_fit": {
     "n": 6,
     "min": 65.02,
     "median": 81.05,
     "max": 133.32
    },
    "uncovered_unrelated": {
     "n": 21,
     "min": 14.11,
     "median": 42.37,
     "max": 126.33
    }
   }
  },
  "recipe_breakdown": {
   "all": {
    "n": 194,
    "first_attempt_pass_rate": {
     "value": 0.9536,
     "n": 194
    },
    "final_pass_rate": {
     "value": 1.0,
     "n": 194
    },
    "integrity_match_rate": {
     "value": 1.0,
     "n": 194
    },
    "test_counts_match_receipt": {
     "value": 1.0,
     "n": 194
    }
   },
   "by_language": {
    "python": {
     "n": 95,
     "first_attempt_pass_rate": {
      "value": 1.0,
      "n": 95
     },
     "final_pass_rate": {
      "value": 1.0,
      "n": 95
     },
     "integrity_match_rate": {
      "value": 1.0,
      "n": 95
     },
     "test_counts_match_receipt": {
      "value": 1.0,
      "n": 95
     }
    },
    "typescript": {
     "n": 99,
     "first_attempt_pass_rate": {
      "value": 0.9091,
      "n": 99
     },
     "final_pass_rate": {
      "value": 1.0,
      "n": 99
     },
     "integrity_match_rate": {
      "value": 1.0,
      "n": 99
     },
     "test_counts_match_receipt": {
      "value": 1.0,
      "n": 99
     }
    }
   },
   "by_category_of_tasks_where_recipe_was_top3": {
    "integration": {
     "n": 106,
     "first_attempt_pass_rate": {
      "value": 0.934,
      "n": 106
     },
     "final_pass_rate": {
      "value": 1.0,
      "n": 106
     },
     "integrity_match_rate": {
      "value": 1.0,
      "n": 106
     },
     "test_counts_match_receipt": {
      "value": 1.0,
      "n": 106
     }
    },
    "version_gotcha": {
     "n": 59,
     "first_attempt_pass_rate": {
      "value": 0.9492,
      "n": 59
     },
     "final_pass_rate": {
      "value": 1.0,
      "n": 59
     },
     "integrity_match_rate": {
      "value": 1.0,
      "n": 59
     },
     "test_counts_match_receipt": {
      "value": 1.0,
      "n": 59
     }
    },
    "messy_question": {
     "n": 64,
     "first_attempt_pass_rate": {
      "value": 0.9688,
      "n": 64
     },
     "final_pass_rate": {
      "value": 1.0,
      "n": 64
     },
     "integrity_match_rate": {
      "value": 1.0,
      "n": 64
     },
     "test_counts_match_receipt": {
      "value": 1.0,
      "n": 64
     }
    },
    "likely_uncovered": {
     "n": 66,
     "first_attempt_pass_rate": {
      "value": 0.9848,
      "n": 66
     },
     "final_pass_rate": {
      "value": 1.0,
      "n": 66
     },
     "integrity_match_rate": {
      "value": 1.0,
      "n": 66
     },
     "test_counts_match_receipt": {
      "value": 1.0,
      "n": 66
     }
    }
   },
   "first_attempt_failures": [
    "aws-sdk-v3-dynamodb-sqs-vitest",
    "axios-retry-nock",
    "effect-schema-vitest",
    "hono-drizzle-sqlite-api",
    "jose-jwks-verify",
    "jotai-atoms-react-testing-library",
    "ky-msw-vitest",
    "redux-toolkit-rtk-query-msw",
    "trpc-client-server-superjson"
   ],
   "setup_retries": {
    "aws-sdk-v3-dynamodb-sqs-vitest": "retry_npm116",
    "axios-retry-nock": "retry_noproxy",
    "effect-schema-vitest": "retry_npm116",
    "hono-drizzle-sqlite-api": "retry_npm116",
    "jose-jwks-verify": "retry_npm116",
    "jotai-atoms-react-testing-library": "retry_npm116",
    "ky-msw-vitest": "retry_npm116",
    "redux-toolkit-rtk-query-msw": "retry_npm116",
    "trpc-client-server-superjson": "retry_npm116"
   },
   "runtime_same_as_receipt": {
    "value": 0.4897,
    "n": 194
   },
   "staleness_values": {
    "unchecked": 100,
    "current": 87,
    "passes_on_latest": 6,
    "breaks_on_latest": 1
   }
  },
  "with_vs_without_breakdown": {
   "per_task": [
    {
     "task_id": "T001",
     "language": "python",
     "category": "integration",
     "covered": true,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      89.5,
      90.0
     ],
     "mean_total_tokens": [
      73907,
      68777
     ],
     "mean_output_chars": [
      5166,
      5896
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": -0.5,
      "mean_total_tokens": 5130,
      "mean_output_chars": -730
     }
    },
    {
     "task_id": "T003",
     "language": "python",
     "category": "integration",
     "covered": true,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      46.1,
      59.2
     ],
     "mean_total_tokens": [
      66637,
      64951
     ],
     "mean_output_chars": [
      2006,
      2314
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": -13.1,
      "mean_total_tokens": 1686,
      "mean_output_chars": -308
     }
    },
    {
     "task_id": "T008",
     "language": "python",
     "category": "integration",
     "covered": true,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      109.0,
      100.2
     ],
     "mean_total_tokens": [
      73681,
      69936
     ],
     "mean_output_chars": [
      4139,
      5093
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 8.8,
      "mean_total_tokens": 3745,
      "mean_output_chars": -954
     }
    },
    {
     "task_id": "T009",
     "language": "python",
     "category": "integration",
     "covered": true,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      39.3,
      27.2
     ],
     "mean_total_tokens": [
      66927,
      62045
     ],
     "mean_output_chars": [
      3505,
      3475
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 12.1,
      "mean_total_tokens": 4882,
      "mean_output_chars": 30
     }
    },
    {
     "task_id": "T011",
     "language": "python",
     "category": "integration",
     "covered": true,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      47.6,
      61.3
     ],
     "mean_total_tokens": [
      67422,
      65953
     ],
     "mean_output_chars": [
      2345,
      3207
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": -13.7,
      "mean_total_tokens": 1469,
      "mean_output_chars": -862
     }
    },
    {
     "task_id": "T041",
     "language": "python",
     "category": "version_gotcha",
     "covered": true,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      75.1,
      47.7
     ],
     "mean_total_tokens": [
      77388,
      64110
     ],
     "mean_output_chars": [
      1957,
      1949
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 27.4,
      "mean_total_tokens": 13278,
      "mean_output_chars": 8
     }
    },
    {
     "task_id": "T043",
     "language": "python",
     "category": "version_gotcha",
     "covered": true,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      192.7,
      152.4
     ],
     "mean_total_tokens": [
      88486,
      75984
     ],
     "mean_output_chars": [
      6860,
      7544
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 40.3,
      "mean_total_tokens": 12502,
      "mean_output_chars": -684
     }
    },
    {
     "task_id": "T044",
     "language": "python",
     "category": "version_gotcha",
     "covered": true,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      48.6,
      38.3
     ],
     "mean_total_tokens": [
      70628,
      62859
     ],
     "mean_output_chars": [
      1274,
      1487
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 10.3,
      "mean_total_tokens": 7769,
      "mean_output_chars": -213
     }
    },
    {
     "task_id": "T048",
     "language": "python",
     "category": "version_gotcha",
     "covered": false,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      118.5,
      104.1
     ],
     "mean_total_tokens": [
      77870,
      70170
     ],
     "mean_output_chars": [
      3347,
      3043
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 14.4,
      "mean_total_tokens": 7700,
      "mean_output_chars": 304
     }
    },
    {
     "task_id": "T065",
     "language": "python",
     "category": "messy_question",
     "covered": false,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      98.2,
      87.4
     ],
     "mean_total_tokens": [
      75177,
      68655
     ],
     "mean_output_chars": [
      2800,
      3553
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 10.8,
      "mean_total_tokens": 6522,
      "mean_output_chars": -753
     }
    },
    {
     "task_id": "T067",
     "language": "python",
     "category": "messy_question",
     "covered": true,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      98.7,
      85.6
     ],
     "mean_total_tokens": [
      73147,
      68927
     ],
     "mean_output_chars": [
      2984,
      3502
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 13.1,
      "mean_total_tokens": 4220,
      "mean_output_chars": -518
     }
    },
    {
     "task_id": "T070",
     "language": "python",
     "category": "messy_question",
     "covered": false,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      92.2,
      108.3
     ],
     "mean_total_tokens": [
      72117,
      70921
     ],
     "mean_output_chars": [
      5617,
      5929
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": -16.1,
      "mean_total_tokens": 1196,
      "mean_output_chars": -312
     }
    },
    {
     "task_id": "T081",
     "language": "python",
     "category": "likely_uncovered",
     "covered": false,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      74.3,
      38.1
     ],
     "mean_total_tokens": [
      66737,
      62925
     ],
     "mean_output_chars": [
      4536,
      4383
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 36.2,
      "mean_total_tokens": 3812,
      "mean_output_chars": 153
     }
    },
    {
     "task_id": "T088",
     "language": "python",
     "category": "likely_uncovered",
     "covered": false,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      52.2,
      26.3
     ],
     "mean_total_tokens": [
      72667,
      61429
     ],
     "mean_output_chars": [
      4107,
      3796
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 25.9,
      "mean_total_tokens": 11238,
      "mean_output_chars": 311
     }
    },
    {
     "task_id": "T090",
     "language": "python",
     "category": "likely_uncovered",
     "covered": false,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      114.1,
      111.4
     ],
     "mean_total_tokens": [
      75747,
      71183
     ],
     "mean_output_chars": [
      3441,
      4499
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 2.7,
      "mean_total_tokens": 4564,
      "mean_output_chars": -1058
     }
    },
    {
     "task_id": "T021",
     "language": "typescript",
     "category": "integration",
     "covered": true,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      82.2,
      62.8
     ],
     "mean_total_tokens": [
      69802,
      65846
     ],
     "mean_output_chars": [
      3081,
      3038
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 19.4,
      "mean_total_tokens": 3956,
      "mean_output_chars": 43
     }
    },
    {
     "task_id": "T023",
     "language": "typescript",
     "category": "integration",
     "covered": true,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      62.0,
      57.7
     ],
     "mean_total_tokens": [
      68933,
      65051
     ],
     "mean_output_chars": [
      2612,
      2656
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 4.3,
      "mean_total_tokens": 3882,
      "mean_output_chars": -44
     }
    },
    {
     "task_id": "T026",
     "language": "typescript",
     "category": "integration",
     "covered": true,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      82.8,
      61.3
     ],
     "mean_total_tokens": [
      76076,
      65863
     ],
     "mean_output_chars": [
      3993,
      4472
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 21.5,
      "mean_total_tokens": 10213,
      "mean_output_chars": -479
     }
    },
    {
     "task_id": "T030",
     "language": "typescript",
     "category": "integration",
     "covered": true,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      48.0,
      46.2
     ],
     "mean_total_tokens": [
      70396,
      64005
     ],
     "mean_output_chars": [
      2678,
      3140
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 1.8,
      "mean_total_tokens": 6391,
      "mean_output_chars": -462
     }
    },
    {
     "task_id": "T033",
     "language": "typescript",
     "category": "integration",
     "covered": false,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      59.5,
      43.8
     ],
     "mean_total_tokens": [
      70308,
      63448
     ],
     "mean_output_chars": [
      1911,
      1954
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 15.7,
      "mean_total_tokens": 6860,
      "mean_output_chars": -43
     }
    },
    {
     "task_id": "T051",
     "language": "typescript",
     "category": "version_gotcha",
     "covered": true,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      237.9,
      244.9
     ],
     "mean_total_tokens": [
      95160,
      87162
     ],
     "mean_output_chars": [
      1869,
      1975
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": -7.0,
      "mean_total_tokens": 7998,
      "mean_output_chars": -106
     }
    },
    {
     "task_id": "T052",
     "language": "typescript",
     "category": "version_gotcha",
     "covered": true,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      71.6,
      61.4
     ],
     "mean_total_tokens": [
      72696,
      65414
     ],
     "mean_output_chars": [
      2404,
      2491
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 10.2,
      "mean_total_tokens": 7282,
      "mean_output_chars": -87
     }
    },
    {
     "task_id": "T055",
     "language": "typescript",
     "category": "version_gotcha",
     "covered": false,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      47.3,
      25.9
     ],
     "mean_total_tokens": [
      69569,
      62038
     ],
     "mean_output_chars": [
      1497,
      1566
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 21.4,
      "mean_total_tokens": 7531,
      "mean_output_chars": -69
     }
    },
    {
     "task_id": "T060",
     "language": "typescript",
     "category": "version_gotcha",
     "covered": true,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      55.1,
      39.7
     ],
     "mean_total_tokens": [
      71253,
      63306
     ],
     "mean_output_chars": [
      2257,
      2072
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 15.4,
      "mean_total_tokens": 7947,
      "mean_output_chars": 185
     }
    },
    {
     "task_id": "T072",
     "language": "typescript",
     "category": "messy_question",
     "covered": false,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      255.4,
      368.6
     ],
     "mean_total_tokens": [
      92221,
      97415
     ],
     "mean_output_chars": [
      4767,
      7287
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": -113.2,
      "mean_total_tokens": -5194,
      "mean_output_chars": -2520
     }
    },
    {
     "task_id": "T073",
     "language": "typescript",
     "category": "messy_question",
     "covered": true,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      51.4,
      63.0
     ],
     "mean_total_tokens": [
      66425,
      65397
     ],
     "mean_output_chars": [
      1996,
      2967
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": -11.6,
      "mean_total_tokens": 1028,
      "mean_output_chars": -971
     }
    },
    {
     "task_id": "T079",
     "language": "typescript",
     "category": "messy_question",
     "covered": false,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      85.9,
      51.5
     ],
     "mean_total_tokens": [
      73682,
      64198
     ],
     "mean_output_chars": [
      2584,
      2684
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 34.4,
      "mean_total_tokens": 9484,
      "mean_output_chars": -100
     }
    },
    {
     "task_id": "T091",
     "language": "typescript",
     "category": "likely_uncovered",
     "covered": false,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      137.2,
      299.5
     ],
     "mean_total_tokens": [
      78340,
      92285
     ],
     "mean_output_chars": [
      3556,
      5038
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": -162.3,
      "mean_total_tokens": -13945,
      "mean_output_chars": -1482
     }
    },
    {
     "task_id": "T098",
     "language": "typescript",
     "category": "likely_uncovered",
     "covered": false,
     "runs": [
      3,
      3
     ],
     "passed": [
      3,
      3
     ],
     "passed_first_try": [
      3,
      3
     ],
     "mean_attempts": [
      1.0,
      1.0
     ],
     "mean_seconds": [
      140.9,
      104.5
     ],
     "mean_total_tokens": [
      81384,
      70560
     ],
     "mean_output_chars": [
      3689,
      3894
     ],
     "diff_with_minus_without": {
      "passed": 0,
      "passed_first_try": 0,
      "mean_attempts": 0.0,
      "mean_seconds": 36.4,
      "mean_total_tokens": 10824,
      "mean_output_chars": -205
     }
    }
   ],
   "win_loss_tie": {
    "pass": {
     "with_wins": 0,
     "without_wins": 0,
     "tie": 29
    },
    "first_try": {
     "with_wins": 0,
     "without_wins": 0,
     "tie": 29
    },
    "attempts": {
     "with_wins": 0,
     "without_wins": 0,
     "tie": 29
    },
    "seconds": {
     "with_wins": 8,
     "without_wins": 21,
     "tie": 0
    },
    "total_tokens": {
     "with_wins": 2,
     "without_wins": 27,
     "tie": 0
    },
    "output_chars": {
     "with_wins": 22,
     "without_wins": 7,
     "tie": 0
    }
   },
   "by_language": {
    "python": {
     "with_recipe": {
      "runs": 45,
      "first_try_pass_rate": 1.0,
      "final_pass_rate": 1.0,
      "median_seconds": 79.5,
      "mean_total_tokens": 73235.9
     },
     "without_recipe": {
      "runs": 45,
      "first_try_pass_rate": 1.0,
      "final_pass_rate": 1.0,
      "median_seconds": 71.5,
      "mean_total_tokens": 67255.0
     }
    },
    "typescript": {
     "with_recipe": {
      "runs": 42,
      "first_try_pass_rate": 1.0,
      "final_pass_rate": 1.0,
      "median_seconds": 73.1,
      "mean_total_tokens": 75446.2
     },
     "without_recipe": {
      "runs": 42,
      "first_try_pass_rate": 1.0,
      "final_pass_rate": 1.0,
      "median_seconds": 58.7,
      "mean_total_tokens": 70856.4
     }
    }
   },
   "by_category": {
    "integration": {
     "with_recipe": {
      "runs": 30,
      "first_try_pass_rate": 1.0,
      "final_pass_rate": 1.0,
      "median_seconds": 61.6,
      "mean_total_tokens": 70409.0
     },
     "without_recipe": {
      "runs": 30,
      "first_try_pass_rate": 1.0,
      "final_pass_rate": 1.0,
      "median_seconds": 55.2,
      "mean_total_tokens": 65587.5
     }
    },
    "version_gotcha": {
     "with_recipe": {
      "runs": 24,
      "first_try_pass_rate": 1.0,
      "final_pass_rate": 1.0,
      "median_seconds": 72.8,
      "mean_total_tokens": 77881.3
     },
     "without_recipe": {
      "runs": 24,
      "first_try_pass_rate": 1.0,
      "final_pass_rate": 1.0,
      "median_seconds": 56.1,
      "mean_total_tokens": 68880.4
     }
    },
    "messy_question": {
     "with_recipe": {
      "runs": 18,
      "first_try_pass_rate": 1.0,
      "final_pass_rate": 1.0,
      "median_seconds": 87.7,
      "mean_total_tokens": 75461.5
     },
     "without_recipe": {
      "runs": 18,
      "first_try_pass_rate": 1.0,
      "final_pass_rate": 1.0,
      "median_seconds": 79.7,
      "mean_total_tokens": 72585.6
     }
    },
    "likely_uncovered": {
     "with_recipe": {
      "runs": 15,
      "first_try_pass_rate": 1.0,
      "final_pass_rate": 1.0,
      "median_seconds": 112.7,
      "mean_total_tokens": 74975.2
     },
     "without_recipe": {
      "runs": 15,
      "first_try_pass_rate": 1.0,
      "final_pass_rate": 1.0,
      "median_seconds": 69.6,
      "mean_total_tokens": 71676.4
     }
    }
   },
   "by_coverage": {
    "covered": {
     "with_recipe": {
      "runs": 51,
      "first_try_pass_rate": 1.0,
      "final_pass_rate": 1.0,
      "median_seconds": 69.0,
      "mean_total_tokens": 73468.5
     },
     "without_recipe": {
      "runs": 51,
      "first_try_pass_rate": 1.0,
      "final_pass_rate": 1.0,
      "median_seconds": 59.4,
      "mean_total_tokens": 67387.4
     }
    },
    "uncovered": {
     "with_recipe": {
      "runs": 36,
      "first_try_pass_rate": 1.0,
      "final_pass_rate": 1.0,
      "median_seconds": 90.8,
      "mean_total_tokens": 75485.0
     },
     "without_recipe": {
      "runs": 36,
      "first_try_pass_rate": 1.0,
      "final_pass_rate": 1.0,
      "median_seconds": 71.1,
      "mean_total_tokens": 71269.0
     }
    }
   },
   "runs_with": 87,
   "runs_without": 87,
   "recipe_used_by_with_runs": [
    {
     "task_id": "T001",
     "run": 1,
     "usage": "used",
     "recipe_id": "fastapi-sqlalchemy-crud",
     "fetched_with_get": [
      "fastapi-sqlalchemy-crud"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T001",
     "run": 2,
     "usage": "used",
     "recipe_id": "fastapi-sqlalchemy-crud",
     "fetched_with_get": [
      "fastapi-sqlalchemy-crud"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T001",
     "run": 3,
     "usage": "used",
     "recipe_id": "fastapi-sqlalchemy-crud",
     "fetched_with_get": [
      "fastapi-sqlalchemy-crud"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T003",
     "run": 1,
     "usage": "used",
     "recipe_id": "httpx-tenacity-retry",
     "fetched_with_get": [
      "httpx-tenacity-retry"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T003",
     "run": 2,
     "usage": "used",
     "recipe_id": "httpx-tenacity-retry",
     "fetched_with_get": [
      "httpx-tenacity-retry"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T003",
     "run": 3,
     "usage": "used",
     "recipe_id": "httpx-tenacity-retry",
     "fetched_with_get": [
      "httpx-tenacity-retry"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T008",
     "run": 1,
     "usage": "used",
     "recipe_id": "fastapi-stripe-webhook",
     "fetched_with_get": [
      "fastapi-stripe-webhook"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T008",
     "run": 2,
     "usage": "used",
     "recipe_id": "fastapi-stripe-webhook",
     "fetched_with_get": [
      "fastapi-stripe-webhook"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T008",
     "run": 3,
     "usage": "used",
     "recipe_id": "fastapi-stripe-webhook",
     "fetched_with_get": [
      "fastapi-stripe-webhook"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T009",
     "run": 1,
     "usage": "used",
     "recipe_id": "boto3-moto-s3-presigned",
     "fetched_with_get": [
      "boto3-moto-s3-presigned"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T009",
     "run": 2,
     "usage": "used",
     "recipe_id": "boto3-moto-s3-presigned",
     "fetched_with_get": [
      "boto3-moto-s3-presigned"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T009",
     "run": 3,
     "usage": "used",
     "recipe_id": "boto3-moto-s3-presigned",
     "fetched_with_get": [
      "boto3-moto-s3-presigned"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T011",
     "run": 1,
     "usage": "used",
     "recipe_id": "duckdb-polars-analytics",
     "fetched_with_get": [
      "duckdb-polars-analytics"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T011",
     "run": 2,
     "usage": "used",
     "recipe_id": "duckdb-polars-analytics",
     "fetched_with_get": [
      "duckdb-polars-analytics"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T011",
     "run": 3,
     "usage": "used",
     "recipe_id": "duckdb-polars-analytics",
     "fetched_with_get": [
      "duckdb-polars-analytics"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T021",
     "run": 1,
     "usage": "used",
     "recipe_id": "express-zod-validation",
     "fetched_with_get": [
      "express-zod-validation"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T021",
     "run": 2,
     "usage": "used",
     "recipe_id": "express-zod-validation",
     "fetched_with_get": [
      "express-zod-validation"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T021",
     "run": 3,
     "usage": "used",
     "recipe_id": "express-zod-validation",
     "fetched_with_get": [
      "express-zod-validation"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T023",
     "run": 1,
     "usage": "used",
     "recipe_id": "hono-rpc-typed-client",
     "fetched_with_get": [
      "hono-rpc-typed-client"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T023",
     "run": 2,
     "usage": "used",
     "recipe_id": "hono-rpc-typed-client",
     "fetched_with_get": [
      "hono-rpc-typed-client"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T023",
     "run": 3,
     "usage": "used",
     "recipe_id": "hono-rpc-typed-client",
     "fetched_with_get": [
      "hono-rpc-typed-client"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T026",
     "run": 1,
     "usage": "reference",
     "recipe_id": "trpc-client-server-superjson",
     "fetched_with_get": [
      "trpc-client-server-superjson",
      "trpc-context-auth-middleware"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T026",
     "run": 2,
     "usage": "used",
     "recipe_id": "trpc-context-auth-middleware",
     "fetched_with_get": [
      "trpc-client-server-superjson",
      "trpc-context-auth-middleware"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T026",
     "run": 3,
     "usage": "used",
     "recipe_id": "trpc-context-auth-middleware",
     "fetched_with_get": [
      "trpc-client-server-superjson",
      "trpc-context-auth-middleware"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T030",
     "run": 1,
     "usage": "used",
     "recipe_id": "jose-jwks-verify",
     "fetched_with_get": [
      "jose-jwks-verify"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T030",
     "run": 2,
     "usage": "used",
     "recipe_id": "jose-jwks-verify",
     "fetched_with_get": [
      "jose-jwks-verify"
     ],
     "searches": 3,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T030",
     "run": 3,
     "usage": "used",
     "recipe_id": "jose-jwks-verify",
     "fetched_with_get": [
      "jose-jwks-verify"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T033",
     "run": 1,
     "usage": "reference",
     "recipe_id": "openai-sdk-mocked-tool-calls",
     "fetched_with_get": [
      "openai-sdk-mocked-tool-calls"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T033",
     "run": 2,
     "usage": "reference",
     "recipe_id": "openai-sdk-mocked-tool-calls",
     "fetched_with_get": [
      "openai-sdk-mocked-tool-calls"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T033",
     "run": 3,
     "usage": "reference",
     "recipe_id": "openai-sdk-mocked-tool-calls",
     "fetched_with_get": [
      "openai-sdk-mocked-tool-calls"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T041",
     "run": 1,
     "usage": "used",
     "recipe_id": "fastapi-pydantic-v2-models",
     "fetched_with_get": [
      "fastapi-pydantic-v2-models"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T041",
     "run": 2,
     "usage": "used",
     "recipe_id": "fastapi-pydantic-v2-models",
     "fetched_with_get": [
      "fastapi-pydantic-v2-models"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T041",
     "run": 3,
     "usage": "used",
     "recipe_id": "fastapi-pydantic-v2-models",
     "fetched_with_get": [
      "fastapi-pydantic-v2-models",
      "sqlalchemy2-pydantic-v2-from-attributes"
     ],
     "searches": 3,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T043",
     "run": 1,
     "usage": "used",
     "recipe_id": "fastapi-httpx-asyncclient-lifespan",
     "fetched_with_get": [
      "fastapi-httpx-asyncclient-lifespan"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T043",
     "run": 2,
     "usage": "used",
     "recipe_id": "fastapi-httpx-asyncclient-lifespan",
     "fetched_with_get": [
      "fastapi-httpx-asyncclient-lifespan"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T043",
     "run": 3,
     "usage": "used",
     "recipe_id": "fastapi-httpx-asyncclient-lifespan",
     "fetched_with_get": [
      "fastapi-httpx-asyncclient-lifespan",
      "starlette-httpx-asgi-client"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T044",
     "run": 1,
     "usage": "used",
     "recipe_id": "fastapi-httpx-asyncclient-lifespan",
     "fetched_with_get": [
      "fastapi-httpx-asyncclient-lifespan"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T044",
     "run": 2,
     "usage": "used",
     "recipe_id": "fastapi-httpx-asyncclient-lifespan",
     "fetched_with_get": [
      "fastapi-httpx-asyncclient-lifespan"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T044",
     "run": 3,
     "usage": "used",
     "recipe_id": "fastapi-httpx-asyncclient-lifespan",
     "fetched_with_get": [
      "fastapi-httpx-asyncclient-lifespan"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T048",
     "run": 1,
     "usage": "none",
     "recipe_id": null,
     "fetched_with_get": [
      "pandas-sqlalchemy-to-sql"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T048",
     "run": 2,
     "usage": "none",
     "recipe_id": null,
     "fetched_with_get": [],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T048",
     "run": 3,
     "usage": "none",
     "recipe_id": null,
     "fetched_with_get": [],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T051",
     "run": 1,
     "usage": "reference",
     "recipe_id": "js-yaml-zod-config",
     "fetched_with_get": [
      "js-yaml-zod-config"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T051",
     "run": 2,
     "usage": "reference",
     "recipe_id": "js-yaml-zod-config",
     "fetched_with_get": [
      "js-yaml-zod-config",
      "express-zod-validation"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T051",
     "run": 3,
     "usage": "reference",
     "recipe_id": "js-yaml-zod-config",
     "fetched_with_get": [
      "js-yaml-zod-config",
      "express-zod-validation"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T052",
     "run": 1,
     "usage": "used",
     "recipe_id": "express5-async-error-handling",
     "fetched_with_get": [
      "express5-async-error-handling"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T052",
     "run": 2,
     "usage": "used",
     "recipe_id": "express5-async-error-handling",
     "fetched_with_get": [
      "express5-async-error-handling"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T052",
     "run": 3,
     "usage": "used",
     "recipe_id": "express5-async-error-handling",
     "fetched_with_get": [
      "express5-async-error-handling"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T055",
     "run": 1,
     "usage": "reference",
     "recipe_id": "fastify-json-schema",
     "fetched_with_get": [
      "fastify-json-schema"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T055",
     "run": 2,
     "usage": "reference",
     "recipe_id": "fastify-json-schema",
     "fetched_with_get": [
      "fastify-json-schema"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T055",
     "run": 3,
     "usage": "reference",
     "recipe_id": "fastify-json-schema",
     "fetched_with_get": [
      "fastify-json-schema"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T060",
     "run": 1,
     "usage": "reference",
     "recipe_id": "openai-sdk-mocked-tool-calls",
     "fetched_with_get": [
      "openai-sdk-mocked-tool-calls"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T060",
     "run": 2,
     "usage": "reference",
     "recipe_id": "openai-sdk-mocked-tool-calls",
     "fetched_with_get": [
      "openai-streaming-mock",
      "openai-sdk-mocked-tool-calls"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T060",
     "run": 3,
     "usage": "reference",
     "recipe_id": "openai-sdk-mocked-tool-calls",
     "fetched_with_get": [
      "openai-sdk-mocked-tool-calls"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T065",
     "run": 1,
     "usage": "reference",
     "recipe_id": "duckdb-polars-analytics",
     "fetched_with_get": [
      "duckdb-polars-analytics"
     ],
     "searches": 4,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T065",
     "run": 2,
     "usage": "reference",
     "recipe_id": "duckdb-polars-analytics",
     "fetched_with_get": [
      "duckdb-polars-analytics"
     ],
     "searches": 3,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T065",
     "run": 3,
     "usage": "reference",
     "recipe_id": "duckdb-polars-analytics",
     "fetched_with_get": [
      "duckdb-polars-analytics"
     ],
     "searches": 5,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T067",
     "run": 1,
     "usage": "used",
     "recipe_id": "pydantic-settings-yaml-secrets",
     "fetched_with_get": [
      "pydantic-settings-yaml-secrets"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T067",
     "run": 2,
     "usage": "used",
     "recipe_id": "pydantic-settings-yaml-secrets",
     "fetched_with_get": [
      "pydantic-settings-yaml-secrets"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T067",
     "run": 3,
     "usage": "used",
     "recipe_id": "pydantic-settings-yaml-secrets",
     "fetched_with_get": [
      "pydantic-settings-yaml-secrets"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T070",
     "run": 1,
     "usage": "used",
     "recipe_id": "fastapi-jwt-auth",
     "fetched_with_get": [
      "fastapi-jwt-auth"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T070",
     "run": 2,
     "usage": "used",
     "recipe_id": "fastapi-jwt-auth",
     "fetched_with_get": [
      "fastapi-jwt-auth"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T070",
     "run": 3,
     "usage": "used",
     "recipe_id": "fastapi-jwt-auth",
     "fetched_with_get": [
      "fastapi-jwt-auth"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T072",
     "run": 1,
     "usage": "used",
     "recipe_id": "axios-retry-nock",
     "fetched_with_get": [
      "axios-retry-nock",
      "bottleneck-rate-limiting"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T072",
     "run": 2,
     "usage": "used",
     "recipe_id": "axios-retry-nock",
     "fetched_with_get": [
      "axios-retry-nock",
      "bottleneck-rate-limiting"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T072",
     "run": 3,
     "usage": "used",
     "recipe_id": "axios-retry-nock",
     "fetched_with_get": [
      "axios-retry-nock",
      "bottleneck-rate-limiting"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T073",
     "run": 1,
     "usage": "used",
     "recipe_id": "express-stripe-webhook",
     "fetched_with_get": [
      "express-stripe-webhook"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T073",
     "run": 2,
     "usage": "used",
     "recipe_id": "express-stripe-webhook",
     "fetched_with_get": [
      "express-stripe-webhook"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T073",
     "run": 3,
     "usage": "used",
     "recipe_id": "express-stripe-webhook",
     "fetched_with_get": [
      "express-stripe-webhook"
     ],
     "searches": 1,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T079",
     "run": 1,
     "usage": "used",
     "recipe_id": "openai-streaming-mock",
     "fetched_with_get": [
      "openai-streaming-mock"
     ],
     "searches": 3,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T079",
     "run": 2,
     "usage": "used",
     "recipe_id": "openai-streaming-mock",
     "fetched_with_get": [
      "openai-streaming-mock"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T079",
     "run": 3,
     "usage": "used",
     "recipe_id": "openai-streaming-mock",
     "fetched_with_get": [
      "openai-streaming-mock"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T081",
     "run": 1,
     "usage": "none",
     "recipe_id": null,
     "fetched_with_get": [],
     "searches": 4,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T081",
     "run": 2,
     "usage": "none",
     "recipe_id": null,
     "fetched_with_get": [],
     "searches": 5,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T081",
     "run": 3,
     "usage": "none",
     "recipe_id": null,
     "fetched_with_get": [
      "pp-ortools-sudoku-cpsat-c5e8"
     ],
     "searches": 4,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T088",
     "run": 1,
     "usage": "none",
     "recipe_id": null,
     "fetched_with_get": [
      "diskcache-cachetools-tiered"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T088",
     "run": 2,
     "usage": "none",
     "recipe_id": null,
     "fetched_with_get": [
      "diskcache-cachetools-tiered"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T088",
     "run": 3,
     "usage": "none",
     "recipe_id": null,
     "fetched_with_get": [
      "diskcache-cachetools-tiered"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T090",
     "run": 1,
     "usage": "used",
     "recipe_id": "litestar-guards-di",
     "fetched_with_get": [
      "litestar-guards-di"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T090",
     "run": 2,
     "usage": "used",
     "recipe_id": "litestar-guards-di",
     "fetched_with_get": [
      "litestar-guards-di"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T090",
     "run": 3,
     "usage": "used",
     "recipe_id": "litestar-guards-di",
     "fetched_with_get": [
      "litestar-guards-di"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T091",
     "run": 1,
     "usage": "used",
     "recipe_id": "effect-schema-vitest",
     "fetched_with_get": [
      "effect-schema-vitest"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T091",
     "run": 2,
     "usage": "used",
     "recipe_id": "effect-schema-vitest",
     "fetched_with_get": [
      "effect-schema-vitest"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T091",
     "run": 3,
     "usage": "used",
     "recipe_id": "effect-schema-vitest",
     "fetched_with_get": [
      "effect-schema-vitest"
     ],
     "searches": 2,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T098",
     "run": 1,
     "usage": "none",
     "recipe_id": null,
     "fetched_with_get": [],
     "searches": 4,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T098",
     "run": 2,
     "usage": "none",
     "recipe_id": null,
     "fetched_with_get": [],
     "searches": 3,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    },
    {
     "task_id": "T098",
     "run": 3,
     "usage": "none",
     "recipe_id": null,
     "fetched_with_get": [
      "json-schema-to-typescript-codegen"
     ],
     "searches": 3,
     "basis": "agent's final note (judgments/arm_notes.jsonl); usage: used = the agent built on the recipe's pattern; reference = read it only to confirm an API detail; none = nothing fitting"
    }
   ],
   "recipe_usage_counts": {
    "used": 59,
    "reference": 16,
    "none": 12
   },
   "by_recipe_usage": {
    "used": {
     "with_recipe": {
      "runs": 59,
      "final_pass_rate": 1.0,
      "median_seconds": 74.9,
      "mean_total_tokens": 73697.1,
      "mean_output_chars": 3338.4
     },
     "without_recipe": {
      "runs": 59,
      "final_pass_rate": 1.0,
      "median_seconds": 67.7,
      "mean_total_tokens": 69618.1,
      "mean_output_chars": 3924.1
     }
    },
    "reference": {
     "with_recipe": {
      "runs": 16,
      "final_pass_rate": 1.0,
      "median_seconds": 65.8,
      "mean_total_tokens": 76265.8,
      "mean_output_chars": 2183.1
     },
     "without_recipe": {
      "runs": 16,
      "final_pass_rate": 1.0,
      "median_seconds": 53.2,
      "mean_total_tokens": 68732.6,
      "mean_output_chars": 2365.4
     }
    },
    "none": {
     "with_recipe": {
      "runs": 12,
      "final_pass_rate": 1.0,
      "median_seconds": 95.5,
      "mean_total_tokens": 74664.6,
      "mean_output_chars": 3919.8
     },
     "without_recipe": {
      "runs": 12,
      "final_pass_rate": 1.0,
      "median_seconds": 51.5,
      "mean_total_tokens": 66271.1,
      "mean_output_chars": 3779.2
     }
    }
   },
   "paired_run_differences": {
    "seconds": {
     "n_pairs": 87,
     "mean_diff_with_minus_without": 1.6,
     "median_diff": 13.0,
     "pairs_with_lower": 29,
     "pairs_with_higher": 58
    },
    "total_tokens": {
     "n_pairs": 87,
     "mean_diff_with_minus_without": 5309.4,
     "median_diff": 6012.0,
     "pairs_with_lower": 12,
     "pairs_with_higher": 75
    },
    "output_chars": {
     "n_pairs": 87,
     "mean_diff_with_minus_without": -411.4,
     "median_diff": -344.0,
     "pairs_with_lower": 60,
     "pairs_with_higher": 27
    }
   },
   "mean_search_calls_per_with_run": 1.84,
   "mean_get_calls_per_with_run": 1.06,
   "tokens_meaning": "total_tokens = the Agent tool's reported subagent_tokens summed over attempts (all tokens the subagent processed, input + output incl. cache); output-only tokens were not reported, so mean_output_tokens is null"
  },
  "latency_breakdown": {
   "all_calls": {
    "n": 819,
    "p50": 156.0,
    "p95": 401.1,
    "max": 633,
    "errors": 0,
    "rate_limited": 0
   },
   "search_recipes": {
    "n": 494,
    "p50": 160.0,
    "p95": 449.0,
    "max": 633,
    "errors": 0,
    "rate_limited": 0
   },
   "get_recipe": {
    "n": 321,
    "p50": 152.0,
    "p95": 225.0,
    "max": 586,
    "errors": 0,
    "rate_limited": 0
   },
   "list_stacks": {
    "n": 1,
    "p50": 226.0,
    "p95": 226.0,
    "max": 226,
    "errors": 0,
    "rate_limited": 0
   },
   "initialize": {
    "n": 1,
    "p50": 226.0,
    "p95": 226.0,
    "max": 226,
    "errors": 0,
    "rate_limited": 0
   },
   "tools/list": {
    "n": 2,
    "p50": 295.0,
    "p95": 417.4,
    "max": 431,
    "errors": 0,
    "rate_limited": 0
   }
  },
  "server_retries_logged": [],
  "docs_review": {
   "url": "https://provenpin.com/docs/",
   "fetched": "one GET with the benchmark User-Agent, saved as docs_review/docs.html and docs_review/docs.txt; no linked page was followed",
   "rating": 3,
   "could_install_from_docs_alone": "yes. One copy-paste snippet each for Claude Code, Cursor, VS Code, Windsurf and Cline, plus 'Streamable HTTP at https://mcp.provenpin.com/mcp' for any other client. No key or signup. My raw-HTTP client worked from that line plus the standard MCP handshake.",
   "good": [
    "short, accurate install instructions for five clients",
    "tools are named with one-line purposes; the versions input formats are listed and match what the server accepted (all 8 formats were detected correctly)",
    "honest caveat: 'A passing receipt proves the recipe works on its pinned versions, not on yours.'",
    "receipts are explained (status, pins, runtime, test counts, CI link, recipe_hash, per-file sha256), and the hashes I recomputed matched for 194/194 recipes"
   ],
   "missing_or_confusing": [
    "how recipe_hash is computed is not stated (I took it from runner/lib.mjs: sha256 over the sorted [recipe.yaml, ...files], each entry hashed as path + NUL + bytes), and recipe.yaml is not served by get_recipe, so 'comparing hashes against your copy' works for single files but not for recipe_hash",
    "nothing on what search returns when nothing fits: in my test it always returned 10 results for descriptive queries, and the score field is not explained",
    "the staleness status in receipts.json (73% 'unchecked', 3 'breaks_on_latest') is not mentioned, and get_recipe does not show it",
    "no mention that setup commands force --ignore-scripts=false, or that 8 recipes need npm >= 11.6 (the runner upgrades npm silently)",
    "no input schemas or limits (for example search limit, rate limits, or what Pro adds) on this page; tools/list gives the schemas"
   ],
   "overclaimed_vs_observed": [
    "'recipes that match your versions rank first': not in check V23 (a mismatching recipe stayed first)",
    "'Each package gets a verdict': test/dev pins (pytest, tsx, @types/*, supertest) are never given one, and a caret range '^23.0.0' was called 'exact' (V20)"
   ],
   "not_verified": [
    "'Lockfiles are never stored'",
    "the local server instructions (cd server && npm install && npm run dev)"
   ],
   "reason_for_rating": "Install and basic use are easy and correct, so a new user can get going. But two of the four claims in the versions section did not hold in my checks, and the page leaves out what a careful user needs to verify receipts or judge freshness and safety. 3 of 5."
  }
 }
}
```
