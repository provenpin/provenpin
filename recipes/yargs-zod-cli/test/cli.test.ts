import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDeploy } from "../src/cli.ts";

test("parses valid deploy argv", async () => {
  const r = await parseDeploy(["--env", "prod", "--tag", "v1.2.3", "--regions", "us", "eu", "--dry-run"]);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.data.env, "prod");
    assert.equal(r.data.tag, "v1.2.3");
    assert.equal(r.data.dryRun, true);
    assert.deepEqual(r.data.regions, ["us", "eu"]);
  }
});

test("rejects bad tag", async () => {
  const r = await parseDeploy(["--env", "dev", "--tag", "nope", "--regions", "us"]);
  assert.equal(r.ok, false);
  if (!r.ok) assert.ok(r.issues.tag);
});
