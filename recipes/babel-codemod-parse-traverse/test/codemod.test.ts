import { test } from "node:test";
import assert from "node:assert/strict";
import { codemod, renameIdentifier, removeConsoleLogs } from "../src/codemod.ts";

test("renames a binding and all of its references", () => {
  const out = renameIdentifier(
    "const count = 1;\nfunction inc() {\n  return count + 1;\n}\n",
    "count",
    "total",
  );
  assert.match(out, /const total = 1;/);
  assert.match(out, /return total \+ 1;/);
  assert.doesNotMatch(out, /\bcount\b/);
});

test("renames bindings per scope, including shadowed ones", () => {
  const out = renameIdentifier(
    "const value = 1;\nfunction f() {\n  const value = 2;\n  return value;\n}\n",
    "value",
    "renamed",
  );
  assert.equal((out.match(/const renamed =/g) ?? []).length, 2);
  assert.match(out, /return renamed;/);
  assert.doesNotMatch(out, /\bvalue\b/);
});

test("respects TypeScript types while renaming values", () => {
  const source =
    'interface User { id: string }\nconst user: User = { id: "1" };\nexport function getId(u: User): string {\n  return u.id;\n}\n';
  const out = renameIdentifier(source, "user", "account");
  assert.match(out, /interface User/);
  assert.match(out, /const account: User =/);
  assert.doesNotMatch(out, /\buser\b/);
});

test("removes console.log calls but keeps other statements", () => {
  const source =
    'const x = 1;\nconsole.log("hello", x);\nconsole["log"]("computed");\nfunction f() {\n  console.log("nested");\n  return x;\n}\nconsole.error("keep me");\n';
  const out = removeConsoleLogs(source);
  assert.doesNotMatch(out, /console\.log/);
  assert.doesNotMatch(out, /console\["log"\]/);
  assert.match(out, /console\.error/);
  assert.match(out, /const x = 1;/);
  assert.match(out, /return x;/);
});

test("combined codemod reports counts and generates code", () => {
  const source =
    "const count = 1;\nconsole.log(count);\nfunction inc() {\n  return count + 1;\n}\n";
  const result = codemod(source, {
    rename: { from: "count", to: "total" },
    removeConsoleLogs: true,
  });
  assert.equal(result.renamed, 1);
  assert.equal(result.removedLogs, 1);
  assert.match(result.code, /const total = 1;/);
  assert.match(result.code, /return total \+ 1;/);
  assert.doesNotMatch(result.code, /console\.log/);
});
