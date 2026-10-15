import { test } from "node:test";
import assert from "node:assert/strict";
import { loadConfig, safeLoadConfig } from "../src/config.ts";

const good = `
name: provenpin
database:
  url: "sqlite://:memory:"
features:
  billing: true
`;

test("loads yaml with defaults", () => {
  const cfg = loadConfig(good);
  assert.equal(cfg.name, "provenpin");
  assert.equal(cfg.port, 3000);
  assert.equal(cfg.features.billing, true);
  assert.equal(cfg.features.beta, false);
  assert.equal(cfg.database.pool, 5);
});

test("rejects missing database", () => {
  const r = safeLoadConfig("name: x\n");
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.issues.database);
});

test("rejects bad types", () => {
  const r = safeLoadConfig("name: x\nport: nope\ndatabase:\n  url: u\n");
  assert.equal(r.ok, false);
});
