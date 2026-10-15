"""ProvenPin benchmark: model-written code vs ProvenPin recipe, same pinned versions, same tests.
Usage: python3 run_bench.py [ids...]   Results -> results/<id>.json, work/<id>/{recipe,model}
"""
import json, os, re, subprocess, sys, shutil, datetime
from mcp import call
MODEL = "opencode/deepseek-v4.1-flash-free"
TASKS = ["fastapi-jwt-auth","fastapi-sqlalchemy-crud","flask-jwt-extended-auth","drf-simplejwt-auth",
 "sqlalchemy-async-aiosqlite","httpx-tenacity-retry","pandas-pyarrow-parquet-roundtrip","typer-cli-testing",
 "celery-tasks-eager-testing","pydantic-settings-dotenv-secrets"]
HERE = os.path.dirname(os.path.abspath(__file__))
def is_harness(p):  # files the model does NOT write: deps, test config, tests
    b = os.path.basename(p)
    return (p.startswith("tests/") or b.startswith("test_") or b in ("conftest.py","pytest.ini","requirements.txt"))
def write(root, files):
    for p, c in files.items():
        f = os.path.join(root, p); os.makedirs(os.path.dirname(f), exist_ok=True); open(f, "w").write(c)
def run(root, r):
    out = {}
    for step in ("setup", "test"):
        p = subprocess.run(r[step], shell=True, cwd=root, capture_output=True, text=True, timeout=600)
        out[step] = {"code": p.returncode, "tail": (p.stdout + p.stderr)[-3000:]}
        if p.returncode: break
    out["passed"] = out.get("test", {}).get("code") == 0
    return out
ARM = os.environ.get("ARM", "A")  # A: tests shown to model. B: only test import lines shown.
def prompt(r, files):
    if ARM == "B":
        files = {p: ("\n".join(l for l in c.splitlines() if l.startswith(("import ", "from "))) if p.startswith("tests/") or os.path.basename(p).startswith("test_") else c) for p, c in files.items()}
    src = [p for p in files if not is_harness(p)]
    tests = "\n\n".join(f"--- {p} ---\n{c}" for p, c in files.items() if is_harness(p) and p != "requirements.txt")
    pins = "\n".join(f"{k}=={v}" for k, v in r["pinned"].items())
    return (f"Task: {r['title']}. {r['summary']}\n\nPython project with EXACTLY these pinned versions:\n{pins}\n\n"
      f"Write these source files: {', '.join(src)}\nThey must make the following existing test files pass (in arm B only the test imports are shown, the test bodies are hidden):\n\n{tests}\n\n"
      "Do not use tools, do not read or write files on disk, answer from your own knowledge. Output ONLY each file as a markdown block whose "
      "first line is the path, like:\n```python path/to/file.py\n<code>\n```")
def parse(text, wanted):
    got = {}
    for m in re.finditer(r"```[a-zA-Z]*[ \t]*([^\n`]*)\n(.*?)```", text, re.S):
        hdr, body = m.group(1).strip(), m.group(2)
        path = next((w for w in wanted if hdr.endswith(w)), None)
        if not path:
            first = body.split("\n", 1)[0].strip().lstrip("#/ ").strip()
            path = next((w for w in wanted if first.endswith(w)), None)
        if path and path not in got: got[path] = body
    return got
def bench(tid):
    r = call("get_recipe", {"id": tid}); files = {f["path"]: f["content"] for f in r["files"]}
    w = os.path.join(HERE, "work" + ("" if ARM == "A" else "_B"), tid); shutil.rmtree(w, ignore_errors=True)
    rec, mod = os.path.join(w, "recipe"), os.path.join(w, "model"); write(rec, files)
    pr = prompt(r, files); open(os.path.join(w, "prompt.txt"), "w").write(pr)
    env = dict(os.environ, PATH=os.path.expanduser("~/.local/bin") + ":" + os.environ["PATH"])
    shutil.rmtree("/tmp/ocblank", ignore_errors=True); os.makedirs("/tmp/ocblank")
    p = subprocess.run(["opencode", "run", "-m", MODEL, pr], stdin=subprocess.DEVNULL, capture_output=True, text=True, timeout=900, env=env, cwd="/tmp/ocblank")
    raw = p.stdout; open(os.path.join(w, "model_raw.txt"), "w").write(raw + "\n--- stderr ---\n" + p.stderr)
    wanted = [x for x in files if not is_harness(x)]
    gen = parse(raw, wanted)
    missing = [x for x in wanted if x not in gen and files[x].strip()]
    write(mod, {**{k: v for k, v in files.items() if is_harness(k)}, **{k: "" for k in wanted if not files[k].strip()}, **gen})
    res = {"arm": ARM, "id": tid, "title": r["title"], "pinned": r["pinned"], "model": MODEL,
           "ran_at": datetime.datetime.now().astimezone().isoformat(), "model_missing_files": missing,
           "recipe": run(rec, r), "model_result": run(mod, r)}
    os.makedirs(os.path.join(HERE, "results" + ("" if ARM == "A" else "_B")), exist_ok=True)
    json.dump(res, open(os.path.join(HERE, "results" + ("" if ARM == "A" else "_B"), tid + ".json"), "w"), indent=1)
    print(tid, "recipe", res["recipe"]["passed"], "model", res["model_result"]["passed"], "missing", missing, flush=True)
if __name__ == "__main__":
    for t in (sys.argv[1:] or TASKS): bench(t)
