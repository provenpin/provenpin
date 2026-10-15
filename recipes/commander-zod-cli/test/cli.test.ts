import { test } from "node:test";
import assert from "node:assert/strict";
import { run, type Note } from "../src/cli.ts";

test("add collects variadic text, repeatable tags and a default priority", async () => {
  const r = await run(["add", "buy", "milk", "-t", "home", "--tag", "errand"]);
  assert.equal(r.code, 0);
  assert.equal(r.stdout, "added #1\n");
  assert.deepEqual(r.store[0], { id: 1, text: "buy milk", tags: ["home", "errand"], priority: "normal" });
});

test("choices() rejects an unknown priority with exit code 1", async () => {
  const r = await run(["add", "x", "-p", "urgent"]);
  assert.equal(r.code, 1);
  assert.equal(r.errorCode, "commander.invalidArgument");
  assert.match(r.stderr, /Allowed choices are low, normal, high/);
});

test("zod refinements surface through program.error with a custom exit code", async () => {
  const r = await run(["add", "x", "-t", "Bad Tag"]);
  assert.equal(r.code, 2);
  assert.equal(r.errorCode, "notes.invalid");
  assert.match(r.stderr, /kebab-case/);
});

test("list prints text or JSON and validates --min through a zod argParser", async () => {
  const store: Note[] = [];
  await run(["add", "one", "-p", "high"], store);
  await run(["add", "two", "-t", "work"], store);
  const text = await run(["list"], store);
  assert.equal(text.stdout, "#1 [high] one\n#2 [normal] two #work\n");
  const json = await run(["list", "--json", "--min", "1"], store);
  assert.deepEqual(JSON.parse(json.stdout).map((n: Note) => n.text), ["one"]);
  const bad = await run(["list", "--min", "zero"], store);
  assert.equal(bad.code, 1);
  assert.match(bad.stderr, /option '--min <n>' argument 'zero' is invalid/);
});

test("--version and missing arguments exit through exitOverride", async () => {
  const v = await run(["--version"]);
  assert.equal(v.code, 0);
  assert.equal(v.stdout.trim(), "1.0.0");
  const missing = await run(["add"]);
  assert.equal(missing.code, 1);
  assert.equal(missing.errorCode, "commander.missingArgument");
});
