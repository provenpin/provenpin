import { test } from "node:test";
import assert from "node:assert/strict";
import { bundleVirtual, type VirtualModules } from "../src/bundle.ts";

const modules: VirtualModules = {
  "virtual:entry": [
    'import { add } from "virtual:math";',
    'import { label } from "virtual:format";',
    'export const result = label() + ": " + add(2, 3);',
  ].join("\n"),
  "virtual:math": [
    "export function add(a, b) { return a + b; }",
    "export function subtract(a, b) { return a - b; }",
  ].join("\n"),
  "virtual:format": [
    'export function label() { return "sum"; }',
    'export function unusedFormatter() { return "never"; }',
  ].join("\n"),
};

function toDataUrl(code: string): string {
  return "data:text/javascript;base64," + Buffer.from(code, "utf8").toString("base64");
}

test("bundles virtual modules to esm", async () => {
  const code = await bundleVirtual("virtual:entry", modules);
  assert.match(code, /result/);
  assert.match(code, /export \{/);
});

test("tree-shaking drops unused exports", async () => {
  const code = await bundleVirtual("virtual:entry", modules);
  assert.doesNotMatch(code, /subtract/);
  assert.doesNotMatch(code, /unusedFormatter/);
});

test("generated bundle runs via a data url import", async () => {
  const code = await bundleVirtual("virtual:entry", modules);
  const mod = (await import(toDataUrl(code))) as { result: string };
  assert.equal(mod.result, "sum: 5");
});
