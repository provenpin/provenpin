import { test } from "node:test";
import assert from "node:assert/strict";
import winston from "winston";
import { createLogger, MemoryTransport, lineFormat } from "../src/logger.ts";

test("json entries with default meta and fixed timestamp", () => {
  const mem = new MemoryTransport();
  createLogger(mem).info("user signed in", { userId: 7 });
  assert.deepEqual(mem.entries, [
    { level: "info", message: "user signed in", userId: 7, service: "provenpin", timestamp: "2026-10-15T20:00:00.000Z" },
  ]);
});

test("redacts secrets", () => {
  const mem = new MemoryTransport();
  createLogger(mem).warn("login", { user: "jp", password: "hunter2", token: "abc" });
  assert.equal(mem.entries[0].password, "[REDACTED]");
  assert.equal(mem.entries[0].token, "[REDACTED]");
  assert.equal(mem.entries[0].user, "jp");
});

test("filter format drops debug from noisy module only", () => {
  const mem = new MemoryTransport();
  const log = createLogger(mem);
  log.debug("tick", { module: "noisy" });
  log.debug("tock", { module: "billing" });
  log.error("boom", { module: "noisy" });
  assert.deepEqual(mem.entries.map((e) => e.message), ["tock", "boom"]);
});

test("errors keep stack and child loggers add meta", () => {
  const mem = new MemoryTransport();
  const child = createLogger(mem).child({ requestId: "r-1" });
  child.error(new Error("db down"));
  assert.equal(mem.entries[0].message, "db down");
  assert.equal(mem.entries[0].requestId, "r-1");
  assert.match(String(mem.entries[0].stack), /Error: db down/);
});

test("level threshold", () => {
  const mem = new MemoryTransport();
  const log = createLogger(mem);
  log.level = "warn";
  log.info("hidden");
  log.warn("shown");
  assert.deepEqual(mem.entries.map((e) => e.message), ["shown"]);
});

test("printf line format", () => {
  const info = lineFormat.transform({ level: "info", message: "hi", timestamp: "T" } as winston.Logform.TransformableInfo) as Record<symbol, string>;
  assert.equal(info[Symbol.for("message")], "T INFO hi");
});
