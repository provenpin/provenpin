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
  const out = 'npm error code ERESOLVE\nnpm error peer typeorm@"^0.3.0 || ^1.0.0-dev" from @nestjs/typeorm@12.0.2\nnpm error peer better-sqlite3@"^12.0.0" from typeorm@1.1.2';
  assert.equal(breakReason(out, ["better-sqlite3"]), "no stable release supports it yet: typeorm@1.1.2 requires better-sqlite3 ^12.0.0");
});
