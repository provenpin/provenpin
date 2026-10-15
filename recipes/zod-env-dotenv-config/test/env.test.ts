import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadEnv } from "../src/env.ts";

const base = { DATABASE_URL: "postgres://u:p@localhost:5432/db", API_KEY: "0123456789abcdef" };

test("coerces and defaults", () => {
  const env = loadEnv({ source: { ...base, PORT: "8080", FEATURE_SIGNUPS: "true" } });
  assert.equal(env.PORT, 8080);
  assert.equal(env.FEATURE_SIGNUPS, true);
  assert.equal(env.NODE_ENV, "development");
});

test("reads a .env file without overriding real env", () => {
  const dir = mkdtempSync(join(tmpdir(), "env-"));
  writeFileSync(join(dir, ".env"), `DATABASE_URL=${base.DATABASE_URL}\nAPI_KEY=fromfile-1234567890\nPORT=9000\n`);
  const env = loadEnv({ path: join(dir, ".env"), source: { PORT: "7000" } });
  assert.equal(env.API_KEY, "fromfile-1234567890");
  assert.equal(env.PORT, 7000);
});

test("readable error listing every bad key", () => {
  assert.throws(() => loadEnv({ source: { DATABASE_URL: "nope", API_KEY: "short", PORT: "0" } }), (e: Error) =>
    /DATABASE_URL/.test(e.message) && /API_KEY/.test(e.message) && /PORT/.test(e.message));
});
