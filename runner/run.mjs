// Runs each recipe's tests in an isolated temp copy and writes receipts/<id>.json.
// Usage: node runner/run.mjs [id ...]   (no ids = all recipes)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { RECEIPTS, listRecipeIds, loadRecipe, validateRecipe, recipeHash, readReceipt, parseCounts } from "./lib.mjs";

const TIMEOUT_MS = +(process.env.PROVENPIN_TIMEOUT_MS ?? 15 * 60 * 1000);

function sh(cmd, cwd) {
  const t0 = Date.now();
  const r = spawnSync("bash", ["-c", cmd], { cwd, encoding: "utf8", timeout: TIMEOUT_MS, maxBuffer: 64 << 20,
    env: { ...process.env, CI: "1", npm_config_update_notifier: "false" } });
  return { code: r.status ?? 124, out: (r.stdout ?? "") + (r.stderr ?? ""), ms: Date.now() - t0 };
}

function version(cmd) { const r = spawnSync("bash", ["-c", cmd], { encoding: "utf8" }); return (r.stdout || "").trim() || null; }

export function runRecipe(id) {
  const r = loadRecipe(id);
  const ranAt = new Date().toISOString();
  const errors = validateRecipe(r);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), `pp-${id}-`));
  let setup = { code: 0, out: "", ms: 0 }, test = { code: 1, out: "", ms: 0 };
  if (errors.length === 0) {
    for (const f of r.files) { fs.mkdirSync(path.dirname(path.join(work, f)), { recursive: true }); fs.copyFileSync(path.join(r.dir, f), path.join(work, f)); }
    setup = sh(r.setup, work);
    if (setup.code === 0) test = sh(r.test, work);
  }
  const counts = parseCounts(test.out, r.runtime);
  const status = errors.length ? "invalid" : setup.code !== 0 ? "setup_failed" : test.code === 0 && counts.failed === 0 && counts.passed > 0 ? "passed" : "failed";
  const prev = readReceipt(id);
  const receipt = {
    id,
    status,
    ran_at: ranAt,
    last_passed_at: status === "passed" ? ranAt : prev?.last_passed_at ?? null,
    tests: { passed: counts.passed, failed: counts.failed },
    duration_ms: { setup: setup.ms, test: test.ms },
    pinned: r.pinned,
    recipe_hash: recipeHash(r),
    environment: {
      os: `${os.platform()} ${os.release()}`,
      arch: os.arch(),
      runtime: r.runtime === "node" ? `node ${process.version}` : version("python3 --version"),
      runner: process.env.GITHUB_ACTIONS ? `github-actions ${process.env.GITHUB_RUN_ID ?? ""}`.trim() : "local",
    },
    errors,
    log_tail: (errors.join("\n") || (setup.code !== 0 ? setup.out : test.out)).split("\n").slice(-40).join("\n"),
  };
  fs.mkdirSync(RECEIPTS, { recursive: true });
  fs.writeFileSync(path.join(RECEIPTS, `${id}.json`), JSON.stringify(receipt, null, 2) + "\n");
  fs.rmSync(work, { recursive: true, force: true });
  return receipt;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : listRecipeIds();
  let bad = 0;
  for (const id of ids) {
    const rc = runRecipe(id);
    if (rc.status !== "passed") bad++;
    console.log(`${rc.status.padEnd(12)} ${id}  (${rc.tests.passed} passed, ${rc.tests.failed} failed, ${Math.round((rc.duration_ms.setup + rc.duration_ms.test) / 1000)}s)`);
  }
  process.exitCode = bad ? 1 : 0;
}
