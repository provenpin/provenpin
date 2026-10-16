import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mergeConfig,
  mergeConfigReplaceArrays,
  cloneConfig,
} from "../src/config.ts";

test("applies nested defaults", () => {
  const config = mergeConfig({ port: 8080, tls: { enabled: true } });
  assert.equal(config.port, 8080);
  assert.equal(config.host, "localhost");
  assert.equal(config.retries, 3);
  assert.equal(config.tls.enabled, true);
  assert.deepEqual(config.features, ["base"]);
});

test("concatenates arrays by default", () => {
  const config = mergeConfig({ features: ["custom"] });
  assert.deepEqual(config.features, ["custom", "base"]);
});

test("replaces arrays with a custom defu merger", () => {
  const config = mergeConfigReplaceArrays({ features: ["custom"] });
  assert.deepEqual(config.features, ["custom"]);
});

test("klona clone is independent from the merged source", () => {
  const merged = mergeConfig({ features: ["custom"], tls: { enabled: true } });
  const copy = cloneConfig(merged);
  assert.notEqual(copy, merged);
  assert.notEqual(copy.tls, merged.tls);
  copy.features.push("extra");
  copy.tls.enabled = false;
  assert.deepEqual(merged.features, ["custom", "base"]);
  assert.equal(merged.tls.enabled, true);
});
