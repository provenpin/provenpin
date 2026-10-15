import { test } from "node:test";
import assert from "node:assert/strict";
import semver from "semver";
import { satisfiesEngine, planUpgrades, sortReleases, bump, describeRange } from "../src/versions.ts";

const releases = ["1.2.3", "1.2.9", "1.4.0", "1.5.0-beta.1", "2.0.0", "2.1.0", "3.0.0-rc.1"];

test("engine checks coerce loose versions like v22.11", () => {
  assert.equal(satisfiesEngine("v22.11", ">=20 <23"), true);
  assert.equal(satisfiesEngine("18.19.0", ">=20"), false);
  assert.equal(satisfiesEngine("garbage", ">=1"), false);
});

test("plans patch, minor and major upgrades ignoring prereleases", () => {
  assert.deepEqual(planUpgrades("1.2.3", releases), { current: "1.2.3", patch: "1.2.9", minor: "1.4.0", major: "2.1.0" });
  assert.deepEqual(planUpgrades("2.1.0", releases), { current: "2.1.0", patch: null, minor: null, major: null });
});

test("sorts and drops invalid versions", () => {
  assert.deepEqual(sortReleases(["2.0.0", "nope", "1.10.0", "1.2.0"]), ["1.2.0", "1.10.0", "2.0.0"]);
});

test("bumps including prerelease ids", () => {
  assert.equal(bump("1.2.3", "minor"), "1.3.0");
  assert.equal(bump("1.2.3", "prerelease", "rc"), "1.2.4-rc.0");
  assert.equal(bump("1.2.4-rc.0", "prerelease", "rc"), "1.2.4-rc.1");
});

test("ranges: validity, minimum version and prerelease opt-in", () => {
  assert.deepEqual(describeRange("^1.4.0 || ^2.0.0"), { valid: true, min: "1.4.0" });
  assert.equal(describeRange("not a range").valid, false);
  assert.equal(semver.satisfies("3.0.0-rc.1", ">=2"), false);
  assert.equal(semver.satisfies("3.0.0-rc.1", ">=2", { includePrerelease: true }), true);
});
