import { test } from "node:test";
import assert from "node:assert/strict";
import { BrokenCircuitError, TaskCancelledError, CircuitState } from "cockatiel";
import { createPolicies, HttpError } from "../src/policies.ts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test("retries transient 5xx errors then succeeds", async () => {
  const { policy, log } = createPolicies({ attempts: 3 });
  let n = 0;
  const v = await policy.execute(async () => {
    if (++n < 3) throw new HttpError(503);
    return "ok";
  });
  assert.equal(v, "ok");
  assert.deepEqual(log, ["retry 1", "retry 2"]);
});

test("4xx errors are not retried", async () => {
  const { policy, log } = createPolicies({ attempts: 3 });
  await assert.rejects(policy.execute(async () => { throw new HttpError(404); }), /HTTP 404/);
  assert.deepEqual(log, []);
});

test("breaker opens after consecutive failures and half-opens later", async () => {
  const { policy, breaker, log } = createPolicies({ attempts: 0, breakAfter: 2, halfOpenAfter: 40 });
  const fail = async () => { throw new HttpError(500); };
  await assert.rejects(policy.execute(fail));
  await assert.rejects(policy.execute(fail));
  assert.equal(breaker.state, CircuitState.Open);
  await assert.rejects(policy.execute(async () => "never"), (e) => e instanceof BrokenCircuitError);
  await sleep(60);
  assert.equal(await policy.execute(async () => "back"), "back");
  assert.equal(breaker.state, CircuitState.Closed);
  assert.deepEqual(log, ["break", "reset"]);
});

test("aggressive timeout cancels slow work", async () => {
  const { policy } = createPolicies({ attempts: 0, timeoutMs: 20 });
  await assert.rejects(
    policy.execute(async ({ signal }) => { await sleep(100); return signal.aborted; }),
    (e) => e instanceof TaskCancelledError,
  );
});
