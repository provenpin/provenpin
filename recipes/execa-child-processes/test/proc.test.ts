import { test } from "node:test";
import assert from "node:assert/strict";
import { runScript, upperCase, listLines, exitInfo, tryRun } from "../src/proc.ts";

test("captures stdout, stderr and env", async () => {
  const r = await runScript("console.log(process.env.GREETING); console.error('warn')", { env: { GREETING: "hello" } });
  assert.equal(r.stdout, "hello");
  assert.equal(r.stderr, "warn");
  assert.equal(r.exitCode, 0);
});

test("pipes input to stdin", async () => {
  assert.equal(await upperCase("abc"), "ABC");
});

test("splits output into lines", async () => {
  assert.deepEqual(await listLines(3), ["line 1", "line 2", "line 3"]);
});

test("reject: false returns the exit code instead of throwing", async () => {
  const r = await exitInfo("console.error('boom'); process.exit(3)");
  assert.deepEqual(r, { exitCode: 3, failed: true, stderr: "boom" });
});

test("non-zero exits throw ExecaError with details", async () => {
  const r = await tryRun("process.exit(2)");
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.exitCode, 2);
    assert.equal(r.timedOut, false);
  }
});

test("timeouts kill hung commands", async () => {
  const r = await tryRun("setTimeout(() => {}, 10000)", 200);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.timedOut, true);
});
