import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadAppConfig, writeFixture } from "../src/load-config.ts";

test("loads .demoapprc.json from search root", () => {
  const root = mkdtempSync(join(tmpdir(), "cosmo-"));
  try {
    writeFixture(root, ".demoapprc.json", { port: 4090, name: "demo" });
    const cfg = loadAppConfig(root);
    assert.equal(cfg.port, 4090);
    assert.equal(cfg.name, "demo");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("throws when no config exists", () => {
  const root = mkdtempSync(join(tmpdir(), "cosmo-empty-"));
  try {
    assert.throws(() => loadAppConfig(root), /config not found/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
