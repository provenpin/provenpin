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
