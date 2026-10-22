import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { stackPins, bumpManifest } from "../staleness.mjs";
import { runUrl } from "../build-index.mjs";

test("stackPins matches stack names to pins, ignoring tooling", () => {
  assert.deepEqual(stackPins({ stack: ["Flask", "sqlalchemy"], pinned: { flask: "3.0.0", SQLAlchemy: "2.0.0", pytest: "8.0.0" } }), ["flask", "SQLAlchemy"]);
});
test("bumpManifest edits only the temp copy's manifests", () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "pp-t-"));
  fs.writeFileSync(path.join(d, "package.json"), JSON.stringify({ dependencies: { zod: "4.0.0" }, devDependencies: { tsx: "1.0.0" } }));
  bumpManifest(d, "node", { zod: "4.1.0" });
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(d, "package.json"))), { dependencies: { zod: "4.1.0" }, devDependencies: { tsx: "1.0.0" } });
  fs.writeFileSync(path.join(d, "requirements.txt"), "flask==3.0.0\npytest==8.0.0\n");
  bumpManifest(d, "python", { flask: "3.1.0" });
  assert.equal(fs.readFileSync(path.join(d, "requirements.txt"), "utf8"), "flask==3.1.0\npytest==8.0.0\n");
});
test("runUrl only for Actions receipts", () => {
  assert.equal(runUrl({ environment: { runner: "github-actions 42" } }), "https://github.com/provenpin/provenpin/actions/runs/42");
  assert.equal(runUrl({ environment: { runner: "local" } }), null);
});
import { highestStable, isStable } from "../affected.mjs";
import { breakReason } from "../staleness.mjs";
test("only stable releases are picked", () => {
  for (const v of ["8.0.0-rc.23", "1.0.0-beta.3", "2.0.0a1", "3.1.0rc1", "1.0.0-canary.4", "15.0.0-next.1", "1.0.dev0"]) assert.equal(isStable(v), false, v);
  assert.equal(highestStable(["7.9.0", "8.0.0-rc.23", "7.10.1", "7.2.0"]), "7.10.1");
  assert.equal(highestStable(["2.1", "2.10", "2.9rc1"]), "2.10");
});
test("peer conflicts are explained", () => {
  assert.match(breakReason('npm error code ERESOLVE\nnpm error peer graphql@"14 - 16" from graphql-request@7.4.0'), /graphql-request@7.4.0 requires graphql 14 - 16/);
});
test("reason prefers the peer line naming the bumped package", () => {
  const out = 'npm error code ERESOLVE\nnpm error peer typeorm@"^0.3.0 || ^1.0.0-dev" from @nestjs/typeorm@12.0.2\nnpm error peerOptional better-sqlite3@"^12.0.0" from typeorm@1.1.2';
  assert.equal(breakReason(out, ["better-sqlite3"]), "no stable release supports it yet: typeorm@1.1.2 requires better-sqlite3 ^12.0.0");
});
import { pickLatest } from "../affected.mjs";
import { lockstepBumps, checkRecipe } from "../staleness.mjs";
test("latest follows the npm dist-tag when it is stable and not deprecated", () => {
  const v = { "1.33.5": {}, "4.0.2": {}, "2.0.0-alpha.2": {} };
  assert.deepEqual(pickLatest(v, "1.33.5"), { version: "1.33.5", deprecated: null });
  assert.equal(pickLatest({ "4.4.6": {}, "4.4.7": {} }, "4.4.6").version, "4.4.6");
  assert.equal(pickLatest({ "7.9.0": {}, "8.0.0-rc.24": {} }, "8.0.0-rc.24").version, "7.9.0");
  assert.equal(pickLatest({ "2.0.0": {}, "2.1.0": { deprecated: "bad build" } }, "2.1.0").version, "2.0.0");
  assert.equal(pickLatest({ "2.0.0": {}, "2.1.0": {} }, undefined).version, "2.1.0");
});
test("all stable versions deprecated gives no version and npm's message", () => {
  const v = { "4.1.1": { deprecated: "old" }, "4.2.0": { deprecated: "Active development of CryptoJS has been discontinued" } };
  assert.deepEqual(pickLatest(v, "4.2.0"), { version: null, deprecated: "Active development of CryptoJS has been discontinued" });
  assert.deepEqual(pickLatest({}, undefined), { version: null, deprecated: null });
});
test("lock-step families bump together, others stay", () => {
  const pinned = { "@nestjs/core": "12.1.3", "@nestjs/common": "12.1.3", "@nestjs/testing": "12.1.3", "@nestjs/typeorm": "12.0.2", rxjs: "7.8.2", "@tanstack/a": "1.0.0", "@tanstack/b": "1.0.0" };
  assert.deepEqual(lockstepBumps(pinned, { "@nestjs/core": "12.2.0", "@tanstack/a": "1.1.0" }),
    { "@nestjs/core": "12.2.0", "@nestjs/common": "12.2.0", "@nestjs/testing": "12.2.0", "@tanstack/a": "1.1.0" });
  assert.deepEqual(lockstepBumps(pinned, { "@nestjs/typeorm": "12.1.0", "@nestjs/core": "12.2.0" })["@nestjs/typeorm"], "12.1.0");
  assert.deepEqual(lockstepBumps(pinned, {}), {});
});
test("checkRecipe reports deprecated_upstream without installing", async () => {
  const info = async () => ({ version: null, deprecated: "Active development of CryptoJS has been discontinued" });
  const res = await checkRecipe("crypto-js-aes-hmac", info);
  assert.equal(res.status, "deprecated_upstream");
  assert.deepEqual(res.deprecated, { "crypto-js": "Active development of CryptoJS has been discontinued" });
  assert.match(res.note, /crypto-js is deprecated upstream: Active development/);
  const miss = await checkRecipe("crypto-js-aes-hmac", async () => ({ version: null, deprecated: null }));
  assert.equal(miss.status, "error");
});
test("checkRecipe is current when every stack pin is already latest", async () => {
  const res = await checkRecipe("nestjs-typeorm-sqlite", async (_rt, k) => ({ version: { "@nestjs/core": "12.1.3", "@nestjs/typeorm": "12.0.2", typeorm: "1.1.2", "better-sqlite3": "13.0.3" }[k], deprecated: null }));
  assert.equal(res.status, "current");
});
test("checkRecipe never bumps a pin down to a lower dist-tag latest", async () => {
  const res = await checkRecipe("nestjs-typeorm-sqlite", async (_rt, k) => ({ version: { "@nestjs/core": "12.1.2", "@nestjs/typeorm": "12.0.2", typeorm: "1.1.2", "better-sqlite3": "13.0.3" }[k], deprecated: null }));
  assert.equal(res.status, "current");
});
