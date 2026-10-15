import { test } from "node:test";
import assert from "node:assert/strict";
import { loadEnv } from "../src/env.ts";

test("applies defaults and coerces types", () => {
  const env = loadEnv({});
  assert.equal(env.NODE_ENV, "test");
  assert.equal(env.PORT, 3000);
  assert.equal(env.MAX_WORKERS, 2);
  assert.equal(env.FEATURE_X, false);
});

test("parses provided values", () => {
  const env = loadEnv({
    NODE_ENV: "production",
    PORT: "8080",
    MAX_WORKERS: "8",
    FEATURE_X: "true",
    API_TOKEN: "secret",
  });
  assert.equal(env.PORT, 8080);
  assert.equal(env.MAX_WORKERS, 8);
  assert.equal(env.FEATURE_X, true);
  assert.equal(env.API_TOKEN, "secret");
});

test("rejects invalid port", () => {
  assert.throws(() => loadEnv({ PORT: "99999" }));
});
