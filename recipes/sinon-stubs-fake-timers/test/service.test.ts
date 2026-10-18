import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import sinon from "sinon";
import { debounce, loadStatus, retry } from "../src/service.ts";

afterEach(() => {
  sinon.restore();
});

test("stub resolves and rejects an object method", async () => {
  const client = { fetchJob: sinon.stub() };
  client.fetchJob.resolves({ id: "j1", status: "done" });
  assert.equal(await loadStatus(client, "j1"), "done");
  assert.deepEqual(client.fetchJob.firstCall.args, ["j1"]);

  client.fetchJob.rejects(new Error("boom"));
  await assert.rejects(() => loadStatus(client, "j2"), /boom/);
});

test("stub onCall returns a scripted sequence", async () => {
  const fetchJob = sinon.stub();
  fetchJob.onFirstCall().resolves({ id: "1", status: "queued" });
  fetchJob.onSecondCall().rejects(new Error("nope"));
  fetchJob.onThirdCall().resolves({ id: "1", status: "done" });

  const client = { fetchJob };
  assert.equal(await loadStatus(client, "1"), "queued");
  await assert.rejects(() => loadStatus(client, "1"), /nope/);
  assert.equal(await loadStatus(client, "1"), "done");
  assert.equal(fetchJob.callCount, 3);
});

test("spy records call count and arguments", () => {
  const logger = { log: (_msg: string): void => undefined };
  const spy = sinon.spy(logger, "log");

  logger.log("hello");
  logger.log("world");

  assert.equal(spy.callCount, 2);
  assert.deepEqual(spy.firstCall.args, ["hello"]);
  assert.deepEqual(spy.secondCall.args, ["world"]);
  assert.ok(spy.calledWith("hello"));
});

test("debounce collapses calls using fake timers", async () => {
  const clock = sinon.useFakeTimers();
  const handler = sinon.spy();
  const debounced = debounce(handler, 100);

  debounced("a");
  clock.tick(50);
  debounced("b");
  assert.equal(handler.callCount, 0);

  await clock.tickAsync(100);
  assert.equal(handler.callCount, 1);
  assert.deepEqual(handler.firstCall.args, ["b"]);

  clock.restore();
});

test("retry backs off between attempts using tickAsync", async () => {
  const clock = sinon.useFakeTimers();
  const fn = sinon.stub();
  fn.onFirstCall().rejects(new Error("temporary"));
  fn.onSecondCall().resolves("ok");

  const pending = retry(fn, { attempts: 3, delayMs: 100 });
  await clock.tickAsync(100);

  assert.equal(await pending, "ok");
  assert.equal(fn.callCount, 2);

  clock.restore();
});

test("sandbox restore returns original behavior", async () => {
  const sandbox = sinon.createSandbox();
  const repo = { find: async (): Promise<string> => "real" };

  sandbox.stub(repo, "find").resolves("stubbed");
  assert.equal(await repo.find(), "stubbed");

  sandbox.restore();
  assert.equal(await repo.find(), "real");
});
