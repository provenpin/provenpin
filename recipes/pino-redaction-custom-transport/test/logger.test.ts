import { test } from "node:test";
import assert from "node:assert/strict";
import { Writable } from "node:stream";
import pino from "pino";
import { createLogger, requestContext, alertTransport } from "../src/logger.ts";

/** Collects JSON lines written by pino. */
function memory() {
  const lines: any[] = [];
  const stream = new Writable({ write(chunk, _enc, cb) { for (const l of chunk.toString().split("\n").filter(Boolean)) lines.push(JSON.parse(l)); cb(); } });
  return { stream, lines };
}

test("redacts secrets at top level, nested, and in arrays", () => {
  const m = memory();
  const log = createLogger(m.stream);
  log.info({ password: "hunter2", headers: { authorization: "Bearer abc", host: "x" }, card: { number: "4242424242424242", last4: "4242" }, users: [{ email: "a@x.test", id: 1 }] }, "signup");
  const [l] = m.lines;
  assert.equal(l.password, "[REDACTED]");
  assert.equal(l.headers.authorization, "[REDACTED]");
  assert.equal(l.headers.host, "x");
  assert.equal(l.card.number, "[REDACTED]");
  assert.equal(l.card.last4, "4242");
  assert.equal(l.users[0].email, "[REDACTED]");
  assert.equal(l.level, "info");
  assert.equal(l.service, "billing");
  assert.match(l.time, /^\d{4}-\d{2}-\d{2}T/);
});

test("child loggers add bindings and wildcard redaction still applies", () => {
  const m = memory();
  const child = createLogger(m.stream).child({ module: "invoices" });
  child.warn({ customer: { password: "pw", id: "c1" } }, "odd login");
  assert.equal(m.lines[0].module, "invoices");
  assert.equal(m.lines[0].customer.password, "[REDACTED]");
  assert.equal(m.lines[0].customer.id, "c1");
});

test("errors are serialised with type, message and stack", () => {
  const m = memory();
  createLogger(m.stream).error({ err: new TypeError("bad input") }, "failed");
  assert.equal(m.lines[0].err.type, "TypeError");
  assert.equal(m.lines[0].err.message, "bad input");
  assert.match(m.lines[0].err.stack, /TypeError: bad input/);
});

test("mixin stamps the AsyncLocalStorage request context on every line", async () => {
  const m = memory();
  const log = createLogger(m.stream, "debug");
  await requestContext.run({ requestId: "req-42", userId: "u7" }, async () => {
    log.debug("start");
    await new Promise((r) => setTimeout(r, 1));
    log.info("after await");
  });
  log.info("outside");
  assert.deepEqual(m.lines.map((l) => [l.msg, l.requestId ?? null]), [["start", "req-42"], ["after await", "req-42"], ["outside", null]]);
  assert.equal(m.lines[0].userId, "u7");
});

test("custom pino-abstract-transport forwards only warn and above", async () => {
  const alerts: { level: string; msg: string; requestId?: string }[] = [];
  const transport = await alertTransport({ sink: (a) => alerts.push(a) });
  const m = memory();
  const log = createLogger(pino.multistream([{ stream: m.stream, level: "debug" }, { stream: transport, level: "debug" }]), "debug");
  requestContext.run({ requestId: "req-9" }, () => {
    log.info("fine");
    log.warn("disk 91%");
    log.error("payment provider down");
  });
  transport.end();
  await new Promise((r) => transport.on("close", r));
  assert.equal(m.lines.length, 3);
  assert.deepEqual(alerts, [
    { level: "warn", msg: "disk 91%", requestId: "req-9" },
    { level: "error", msg: "payment provider down", requestId: "req-9" },
  ]);
});
