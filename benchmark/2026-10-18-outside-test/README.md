# Outside test of ProvenPin (2026-10-18)

An outside test of the ProvenPin MCP server and recipes, run 2026-10-18 from 03:50 to 06:05 UTC by a separate AI agent session (model `claude-opus-5-5`, see `judgments/run_info.json`). It designed 100 everyday coding tasks, searched ProvenPin for each, ran 194 recipes, and compared a coding agent with and without ProvenPin on 29 tasks.

It was not fully at arm's length: ProvenPin's owner set the session's network access, and its prompt supplied the MCP client `pp.py` (see report section 7). The tasks and acceptance tests are the tester's own, written and frozen before any search.

- Full write-up: `report.md`
- Every score: `results.json` (`scores` block) and `score_out.json`
- Raw rows behind the scores: `csv/` and `judgments/`
- Tasks: `tasks.jsonl`; frozen acceptance-test hashes: `acceptance_manifest.json`
- Search results as returned (no filter), one per task: `runs/<task>/search/s1_nofilter.json`
- The tester's run state: `state.json`; the tester's map from each recipe to the tasks where it was "in the top 3" (score.py line 66): `index/top3_recipes.json`

## Check the numbers yourself

```
python3 score.py
```

`score.py` is the tester's own scoring script. Run on the files in this folder, it rewrites `results.json` and `score_out.json`, and both come out byte for byte identical to the copies published here.

## What was changed

Names of people, the tester's private working paths and a fixed tool header were replaced, nothing else:

| replaced with | files (count) |
|---|---|
| `[the owner]` | report.md (3), results.json (1), judgments/run_info.json (1), state.json (3) |
| `[team member]` | report.md (2) |
| `<workdir>/` (the tester's temporary folder path) | judgments/arm_notes.jsonl (180) |
| `[hand-back frame removed]` (a fixed tool header before each agent's note) | judgments/arm_notes.jsonl (174) |

The second replacement sits in the report's own disclosure (section 7) that links the test to someone on the ProvenPin team. That disclosure is kept; only the name is removed.

All other text is the tester's own and unedited. `report.md` refers to its folder as `provenpin-bench-2026-10-18/`; that folder is this one.

## What is not here

The full results folder is about 36 MB. Left out: per-call logs, the coding agents' outputs and acceptance tests per task, copies of the recipes as downloaded (the recipes are in `recipes/` of this repo), version-check raw output, and the tester's helper scripts. `report.md` mentions some of these files; they are not published.
