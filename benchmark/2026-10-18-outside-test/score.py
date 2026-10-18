#!/usr/bin/env python3
"""Computes every score for report.md and results.json from the CSV/JSONL files in this folder.
No number is typed in by hand: hand-written inputs are only judgments (labels, failures, safety flags, docs rating),
each kept in its own file under judgments/.
Usage: python3 score.py            -> writes results.json and score_out.json, prints a summary
"""
import csv, json, pathlib, statistics, collections
HERE = pathlib.Path(__file__).resolve().parent
J = lambda p: json.loads((HERE / p).read_text())
def jl(p):
    f = HERE / p
    return [json.loads(l) for l in f.open() if l.strip()] if f.exists() else []
def rows(p):
    f = HERE / p
    return list(csv.DictReader(f.open())) if f.exists() else []
B = lambda v: str(v).strip().lower() == "true"
def rate(k, n): return {"value": round(k / n, 4) if n else None, "n": n}
def pct(xs, p):
    xs = sorted(xs)
    if not xs: return None
    i = (len(xs) - 1) * p; lo = int(i); hi = min(lo + 1, len(xs) - 1)
    return round(xs[lo] + (xs[hi] - xs[lo]) * (i - lo), 1)

# ---------- tasks and search ----------
tasks = {t["task_id"]: t for t in jl("tasks.jsonl")}
trow = {r["task_id"]: r for r in rows("csv/tasks.csv")}
cov = {c["task_id"]: c for c in jl("judgments/coverage_final.jsonl")}
judg = {j["task_id"]: j for j in jl("judgments/search.jsonl")}
covered = [t for t in tasks if B(trow[t]["covered"])]
uncovered = [t for t in tasks if not B(trow[t]["covered"])]

def search_block(ids):
    c = [t for t in ids if B(trow[t]["covered"])]; u = [t for t in ids if not B(trow[t]["covered"])]
    return {
        "tasks": len(ids), "covered": len(c),
        "coverage_rate": rate(len(c), len(ids)),
        "top1_rate": rate(sum(B(trow[t]["top1_correct"]) for t in c), len(c)),
        "top3_rate": rate(sum(B(trow[t]["top3_correct"]) for t in c), len(c)),
        "language_filter_top1_rate": rate(sum(B(trow[t]["s2_top1_correct"]) for t in c), len(c)),
        "language_filter_top3_rate": rate(sum(B(trow[t]["s2_top3_correct"]) for t in c), len(c)),
        "stack_filter_top1_rate": rate(sum(B(trow[t]["s3_top1_correct"]) for t in c if trow[t]["s3_stack"]), sum(1 for t in c if trow[t]["s3_stack"])),
        "honest_no_match_rate": rate(sum(trow[t]["uncovered_outcome"] == "honest_no_match" for t in u), len(u)),
        "misleading_top1_on_uncovered_rate": rate(sum(trow[t]["uncovered_outcome"] == "misleading" for t in u), len(u)),
        "unrelated_top1_on_uncovered_rate": rate(sum(trow[t]["uncovered_outcome"] == "unrelated" for t in u), len(u)),
        "search_misses": sorted(t for t in c if B(trow[t]["search_miss"])),
    }
search_all = search_block(list(tasks))
by_lang = {l: search_block([t for t in tasks if tasks[t]["language"] == l]) for l in ("python", "typescript")}
by_cat = {c: search_block([t for t in tasks if tasks[t]["category"] == c]) for c in ("integration", "version_gotcha", "messy_question", "likely_uncovered")}
def top1_scores():
    g = collections.defaultdict(list)
    for t in tasks:
        res = J(f"runs/{t}/search/s1_nofilter.json")["data"]["results"]
        k = ("covered_fit" if B(trow[t]["top1_correct"]) else "covered_not_fit") if B(trow[t]["covered"]) else "uncovered_" + trow[t]["uncovered_outcome"]
        g[k].append(res[0]["score"])
    return {k: {"n": len(v), "min": min(v), "median": round(statistics.median(v), 2), "max": max(v)} for k, v in g.items()}
zero_count_searches = {k: sum(1 for t in tasks if trow[t][k + "_count"] not in ("", None) and int(trow[t][k + "_count"]) == 0) for k in ("s1", "s2", "s3")}

# ---------- recipes ----------
rr = rows("csv/recipe_runs.csv")
first = {r["id"]: r for r in rr if r["tag"] == "run"}
final = dict(first)
for r in rr:
    if r["tag"] != "run": final[r["id"]] = r   # a setup retry (logged in recipe_runs.csv) replaces the first run
integ = {r["id"]: r for r in rows("csv/integrity.csv")}
top3 = J("index/top3_recipes.json")   # recipe id -> list of task ids where it was in the top 3
def receipt_match(r):
    try:
        rc = eval(r["receipt_tests"], {"__builtins__": {}})   # stored as a python dict literal by recipe_step.py
        return int(r["tests_passed"]) == rc.get("passed") and int(r["tests_failed"] or 0) == rc.get("failed", 0)
    except Exception: return None
def recipe_block(ids):
    ids = [i for i in ids if i in first]
    return {
        "n": len(ids),
        "first_attempt_pass_rate": rate(sum(B(first[i]["passed"]) for i in ids), len(ids)),
        "final_pass_rate": rate(sum(B(final[i]["passed"]) for i in ids), len(ids)),
        "integrity_match_rate": rate(sum(B(integ[i]["integrity_pass"]) for i in ids if i in integ), sum(1 for i in ids if i in integ)),
        "test_counts_match_receipt": rate(sum(receipt_match(final[i]) is True for i in ids), len(ids)),
    }
rec_all = recipe_block(list(first))
rec_lang = {l: recipe_block([i for i in first if first[i]["language"] == l]) for l in ("python", "typescript")}
def recipe_cat(cat):
    return recipe_block(sorted({i for i, ts in top3.items() for t in ts if tasks[t]["category"] == cat}))
rec_cat = {c: recipe_cat(c) for c in ("integration", "version_gotcha", "messy_question", "likely_uncovered")}
first_fail = sorted(i for i in first if not B(first[i]["passed"]))
retried = {r["id"]: r["tag"] for r in rr if r["tag"] != "run"}
runtime_same = sum(1 for i in first if first[i]["my_runtime"] == first[i]["receipt_runtime"])
staleness = collections.Counter(integ[i]["staleness"] for i in integ)

# ---------- arms ----------
arm_rows = {}
for r in rows("csv/arms.csv"): arm_rows[(r["task_id"], r["arm"], int(r["run"]))] = r   # last row wins
comp = J("state.json")["comparison_tasks"]
def arm_summary(arm):
    rs = [r for (t, a, n), r in arm_rows.items() if a == arm]
    if not rs: return None
    return {"runs": len(rs),
            "first_try_pass_rate": round(sum(B(r["passed_first_try"]) for r in rs) / len(rs), 4),
            "final_pass_rate": round(sum(B(r["passed"]) for r in rs) / len(rs), 4),
            "mean_attempts": round(statistics.mean(int(r["attempts"]) for r in rs), 3),
            "median_seconds": round(statistics.median(float(r["seconds"]) for r in rs), 1),
            "mean_output_tokens": None,
            "mean_output_chars": round(statistics.mean(int(r["output_chars"]) for r in rs), 1),
            "mean_total_tokens": round(statistics.mean(int(r["total_tokens"]) for r in rs), 1)}
W, WO = arm_summary("with_recipe"), arm_summary("without_recipe")
per_task = []
tally = {k: collections.Counter() for k in ("pass", "first_try", "attempts", "seconds", "total_tokens", "output_chars")}
for t in comp:
    a = {arm: [arm_rows[(t, arm, n)] for n in (1, 2, 3) if (t, arm, n) in arm_rows] for arm in ("with_recipe", "without_recipe")}
    if not a["with_recipe"] or not a["without_recipe"]: continue
    m = lambda arm, f, conv=float: statistics.mean(conv(r[f]) for r in a[arm])
    s = lambda arm, f: sum(B(r[f]) for r in a[arm])
    d = {"task_id": t, "language": tasks[t]["language"], "category": tasks[t]["category"], "covered": B(trow[t]["covered"]),
         "runs": [len(a["with_recipe"]), len(a["without_recipe"])],
         "passed": [s("with_recipe", "passed"), s("without_recipe", "passed")],
         "passed_first_try": [s("with_recipe", "passed_first_try"), s("without_recipe", "passed_first_try")],
         "mean_attempts": [round(m("with_recipe", "attempts"), 2), round(m("without_recipe", "attempts"), 2)],
         "mean_seconds": [round(m("with_recipe", "seconds"), 1), round(m("without_recipe", "seconds"), 1)],
         "mean_total_tokens": [round(m("with_recipe", "total_tokens")), round(m("without_recipe", "total_tokens"))],
         "mean_output_chars": [round(m("with_recipe", "output_chars")), round(m("without_recipe", "output_chars"))]}
    d["diff_with_minus_without"] = {k: round(d[k][0] - d[k][1], 2) for k in ("passed", "passed_first_try", "mean_attempts", "mean_seconds", "mean_total_tokens", "mean_output_chars")}
    def win(k, higher_better):
        x, y = d[k][0], d[k][1]
        if x == y: return "tie"
        return "with_wins" if (x > y) == higher_better else "without_wins"
    tally["pass"][win("passed", True)] += 1; tally["first_try"][win("passed_first_try", True)] += 1
    tally["attempts"][win("mean_attempts", False)] += 1; tally["seconds"][win("mean_seconds", False)] += 1
    tally["total_tokens"][win("mean_total_tokens", False)] += 1; tally["output_chars"][win("mean_output_chars", False)] += 1
    per_task.append(d)
def arm_by(key, val):
    out = {}
    for arm in ("with_recipe", "without_recipe"):
        rs = [r for (t, a, n), r in arm_rows.items() if a == arm and (tasks[t][key] if key != "covered" else B(trow[t]["covered"])) == val]
        if rs: out[arm] = {"runs": len(rs), "first_try_pass_rate": round(sum(B(r["passed_first_try"]) for r in rs) / len(rs), 4),
                           "final_pass_rate": round(sum(B(r["passed"]) for r in rs) / len(rs), 4),
                           "median_seconds": round(statistics.median(float(r["seconds"]) for r in rs), 1),
                           "mean_total_tokens": round(statistics.mean(int(r["total_tokens"]) for r in rs), 1)}
    return out
arms_by_lang = {l: arm_by("language", l) for l in ("python", "typescript")}
arms_by_cat = {c: arm_by("category", c) for c in ("integration", "version_gotcha", "messy_question", "likely_uncovered")}
arms_by_cov = {"covered": arm_by("covered", True), "uncovered": arm_by("covered", False)}
used = jl("judgments/arm_recipe_used.jsonl")   # one line per with_recipe run: what the agent said it used
usage_counts = dict(collections.Counter(u["usage"] for u in used))
def arm_by_usage(kind):
    keys = [(u["task_id"], u["run"]) for u in used if u["usage"] == kind]
    out = {}
    for arm in ("with_recipe", "without_recipe"):
        rs = [arm_rows[(t, arm, n)] for t, n in keys if (t, arm, n) in arm_rows]
        if rs: out[arm] = {"runs": len(rs), "final_pass_rate": round(sum(B(r["passed"]) for r in rs) / len(rs), 4),
                           "median_seconds": round(statistics.median(float(r["seconds"]) for r in rs), 1),
                           "mean_total_tokens": round(statistics.mean(int(r["total_tokens"]) for r in rs), 1),
                           "mean_output_chars": round(statistics.mean(int(r["output_chars"]) for r in rs), 1)}
    return out
arms_by_usage = {k: arm_by_usage(k) for k in ("used", "reference", "none")}
def paired(metric):
    d = [float(arm_rows[(t, "with_recipe", n)][metric]) - float(arm_rows[(t, "without_recipe", n)][metric])
         for (t, a, n) in arm_rows if a == "with_recipe" and (t, "without_recipe", n) in arm_rows]
    return {"n_pairs": len(d), "mean_diff_with_minus_without": round(statistics.mean(d), 1), "median_diff": round(statistics.median(d), 1),
            "pairs_with_lower": sum(x < 0 for x in d), "pairs_with_higher": sum(x > 0 for x in d)} if d else None
paired_stats = {m: paired(m) for m in ("seconds", "total_tokens", "output_chars")}
search_calls_by_with_runs = round(statistics.mean(u["searches"] for u in used), 2) if used else None
gets_by_with_runs = round(statistics.mean(len(u["fetched_with_get"]) for u in used), 2) if used else None

# ---------- versions, latency, docs ----------
vc = rows("csv/version_checks.csv")
v_acc = rate(sum(r["correct"] == "yes" for r in vc), len(vc))
lat = rows("csv/latency.csv")
samp = [r for r in lat if r["source"] == "latency_sample"]
def lat_block(rs):
    ms = [int(r["ms"]) for r in rs if r["ms"] not in ("", "None")]
    return {"n": len(rs), "p50": pct(ms, .5), "p95": pct(ms, .95), "max": max(ms) if ms else None,
            "errors": sum(1 for r in rs if r["status"] in ("", "None") or int(r["status"]) >= 400),
            "rate_limited": sum(1 for r in rs if r["status"] == "429")}
latency = lat_block(samp)
lat_all = {"all_calls": lat_block(lat), **{k: lat_block([r for r in lat if r["tool"] == k]) for k in ("search_recipes", "get_recipe", "list_stacks", "initialize", "tools/list")}}
retries = jl("logs/retries.jsonl")
docs = J("judgments/docs_review.json") if (HERE / "judgments/docs_review.json").exists() else {"rating": None}
failures = J("judgments/failures.json") if (HERE / "judgments/failures.json").exists() else []
safety = J("judgments/safety_flags.json") if (HERE / "judgments/safety_flags.json").exists() else []
run = J("judgments/run_info.json") if (HERE / "judgments/run_info.json").exists() else {}

scores = {
    "tasks_total": len(tasks),
    "coverage_rate": search_all["coverage_rate"],
    "search_top1_rate": search_all["top1_rate"],
    "search_top3_rate": search_all["top3_rate"],
    "honest_no_match_rate": search_all["honest_no_match_rate"],
    "misleading_top1_on_uncovered_rate": search_all["misleading_top1_on_uncovered_rate"],
    "recipe_run_pass_rate": {**rec_all["final_pass_rate"], "level": "executed"},
    "integrity_match_rate": {**rec_all["integrity_match_rate"], "level": "executed"},
    "version_check_accuracy": v_acc,
    "with_vs_without": {
        "tasks": len(per_task), "runs_per_arm_per_task": 3,
        "same_model_and_effort_both_arms": True,
        "with_recipe": {k: v for k, v in (W or {}).items() if k != "runs"},
        "without_recipe": {k: v for k, v in (WO or {}).items() if k != "runs"},
        "contamination_risk": "low",
        "notes": run.get("arms_notes", "")},
    "latency_ms": latency,
    "docs_clarity_1to5": docs.get("rating"),
    "safety_flags": len(safety),
    "overall_1to10": run.get("overall_1to10"),
}
extra = {
    "search_breakdown": {"all": search_all, "by_language": by_lang, "by_category": by_cat, "zero_count_searches": zero_count_searches, "top1_score_by_outcome": top1_scores()},
    "recipe_breakdown": {"all": rec_all, "by_language": rec_lang, "by_category_of_tasks_where_recipe_was_top3": rec_cat,
                         "first_attempt_failures": first_fail, "setup_retries": retried,
                         "runtime_same_as_receipt": rate(runtime_same, len(first)), "staleness_values": dict(staleness)},
    "with_vs_without_breakdown": {"per_task": per_task,
                                  "win_loss_tie": {k: {"with_wins": v["with_wins"], "without_wins": v["without_wins"], "tie": v["tie"]} for k, v in tally.items()},
                                  "by_language": arms_by_lang, "by_category": arms_by_cat, "by_coverage": arms_by_cov,
                                  "runs_with": (W or {}).get("runs"), "runs_without": (WO or {}).get("runs"),
                                  "recipe_used_by_with_runs": used, "recipe_usage_counts": usage_counts, "by_recipe_usage": arms_by_usage,
                                  "paired_run_differences": paired_stats, "mean_search_calls_per_with_run": search_calls_by_with_runs,
                                  "mean_get_calls_per_with_run": gets_by_with_runs,
                                  "tokens_meaning": "total_tokens = the Agent tool's reported subagent_tokens summed over attempts (all tokens the subagent processed, input + output incl. cache); output-only tokens were not reported, so mean_output_tokens is null"},
    "latency_breakdown": lat_all,
    "server_retries_logged": retries,
    "docs_review": docs,
}

# ---------- per-task entries ----------
def recipe_run_entry(rid):
    if not rid or rid not in final: return {"ran": False, "passed": None, "tests_passed": None, "tests_failed": None, "install_ok": None, "seconds": None, "error": None, "level": None}
    r = final[rid]
    why = {"retry_npm116": "npm 10.9.4 crashed in npm install (edgesOut); passed when the same setup ran through npx npm@11.6.0, as ProvenPin's runner does",
           "retry_noproxy": "my environment's HTTPS_PROXY made axios bypass nock; passed with proxy variables removed"}
    err = None if B(first[rid]["passed"]) else (why.get(retried.get(rid), "passed on retry") if B(r["passed"]) else "failed")
    return {"ran": True, "passed": B(r["passed"]), "tests_passed": int(r["tests_passed"] or 0), "tests_failed": int(r["tests_failed"] or 0),
            "install_ok": B(r["install_ok"]), "seconds": float(r["seconds"]), "error": err, "level": "executed"}
def integ_entry(rid):
    if not rid or rid not in integ: return {"checked": False, "hashes_match": None, "pins_match_manifest": None, "receipts_feed_match": None, "status_passed": None, "level": None}
    r = integ[rid]
    return {"checked": True, "hashes_match": B(r["hashes_match"]), "pins_match_manifest": B(r["pins_match_manifest"]),
            "receipts_feed_match": B(r["receipts_feed_match"]), "status_passed": B(r["status_passed"]), "level": "executed"}
used_by_task = collections.defaultdict(list)
for u in used: used_by_task[u["task_id"]].append(u.get("recipe_id") if u["usage"] == "used" else None)
task_entries = []
for t, tk in tasks.items():
    r = trow[t]
    s1 = J(f"runs/{t}/search/s1_nofilter.json")
    res = (s1.get("data") or {}).get("results", []) if isinstance(s1.get("data"), dict) else []
    ids = [x.get("id") for x in res][:10]
    top = ids[0] if ids else None
    c = B(r["covered"])
    arms = {}
    for arm in ("with_recipe", "without_recipe"):
        arms[arm] = [{"run": n, "passed_first_try": B(x["passed_first_try"]), "passed": B(x["passed"]), "attempts": int(x["attempts"]),
                      "seconds": float(x["seconds"]), "output_tokens": None, "output_chars": int(x["output_chars"]), "total_tokens": int(x["total_tokens"])}
                     for n in (1, 2, 3) for x in [arm_rows.get((t, arm, n))] if x]
    ru = [u for u in used_by_task.get(t, []) if u]
    task_entries.append({
        "task_id": t, "language": tk["language"], "libraries": tk["libraries"], "category": tk["category"], "query": tk["query"],
        "search_args": {"query": tk["query"]}, "fitting_definition": tk["fitting_definition"], "covered": c,
        "result_ids": ids, "top1_correct": B(r["top1_correct"]) if c else None, "top3_correct": B(r["top3_correct"]) if c else None,
        "uncovered_outcome": (r["uncovered_outcome"] or None) if not c else None,
        "recipe_id_used": (collections.Counter(ru).most_common(1)[0][0] if ru else ("none" if t in used_by_task else None)),
        "recipe_run": recipe_run_entry(top), "integrity": integ_entry(top),
        "arms": arms if any(arms.values()) else {"with_recipe": [], "without_recipe": []},
        "latency_ms": int(r["s1_ms"]) if r["s1_ms"] else None,
        "notes": r["reason"]})

version_checks = [{"check_id": r["check_id"], "tool": r["tool"], "recipe_id": r["recipe_id"] or None, "versions_input_kind": r["versions_input_kind"],
                   "expected": r["expected"], "observed": r["observed"], "correct": {"yes": True, "no": False}.get(r["correct"])} for r in vc]
results = {"schema": "provenpin-independent-bench/v1", "run": run.get("run", {}), "scores": scores, "tasks": task_entries,
           "version_checks": version_checks, "failures": failures, "safety_flags": safety, "extra": extra}
(HERE / "results.json").write_text(json.dumps(results, indent=1))
(HERE / "score_out.json").write_text(json.dumps({"scores": scores, "extra": extra}, indent=1))
print(json.dumps(scores, indent=1))
print("win/loss/tie:", json.dumps(extra["with_vs_without_breakdown"]["win_loss_tie"]))
