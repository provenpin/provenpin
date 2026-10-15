# ProvenPin mini benchmark (2026-10-15)

Question: when a free AI model writes code for pinned library versions, does it run, compared with the ProvenPin recipe for the same task?

- Model: `opencode/deepseek-v4.1-flash-free` via `opencode run`, empty working dir, no tools, no docs, no web.
- Tasks: 10 Python recipes from https://mcp.provenpin.com/mcp (get_recipe). List in `run_bench.py`.
- Grading: recipe files and model files are installed separately in fresh uv venvs with the recipe's pinned `requirements.txt`, then the recipe's own pytest suite runs against each. Pass = pytest exit 0.
- Arm A (`ARM=A`): model sees task, pins, file paths and the full test files.
- Arm B (`ARM=B`): model sees task, pins, file paths and only the import lines of the test files (test bodies hidden).

Run: `ARM=A python3 run_bench.py` / `ARM=B python3 run_bench.py` (needs uv, opencode, OPENCODE_API_KEY).

Files: `results/` (arm A), `results_B/` (arm B), `work*/<id>/{prompt.txt,model_raw.txt,recipe/,model/}`, `summary.txt`.
`run_A_first_attempt.log` is an earlier arm A run (10/10 model passes). Its JSON and model outputs were overwritten by a path bug, so only that log line survives. Not counted in the post's table.
venvs were deleted after the run to save space.
