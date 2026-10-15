import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "../src/css.ts";

const t = { brand: "#0b3d91", radius: "6px" };

test("custom plugin resolves tokens and converts px to rem", async () => {
  const { css } = await build(".btn { color: theme(brand); border-radius: theme(radius); padding: 8px 12px; font-size: 14px; }", t);
  assert.match(css, /color: #0b3d91/);
  assert.match(css, /border-radius: 6px/);
  assert.match(css, /padding: 0\.5rem 0\.75rem/);
  assert.match(css, /font-size: 0\.875rem/);
});

test("autoprefixer adds prefixes for pinned browsers", async () => {
  const { css } = await build(".a { user-select: none; } .g { display: grid; grid-template-columns: 1fr 1fr; } .s { position: sticky; }", t);
  assert.match(css, /-webkit-user-select: none/);
  assert.match(css, /-moz-user-select: none/);
  assert.match(css, /-ms-user-select: none/);
  assert.match(css, /display: -ms-grid/);
  assert.match(css, /-ms-grid-columns: 1fr 1fr/);
  assert.match(css, /position: -webkit-sticky/);
});

test("removes @debug at-rules and emits a source map", async () => {
  const { css, map } = await build("@debug 'x';\n.a { margin: 4px; }", t);
  assert.doesNotMatch(css, /@debug/);
  assert.equal(map.version, 3);
  assert.deepEqual(map.sources, ["in.css"]);
});

test("unknown token raises a CssSyntaxError with position", async () => {
  await assert.rejects(build(".a {\n  color: theme(nope);\n}", t), (e: Error & { line?: number; name: string }) => {
    assert.equal(e.name, "CssSyntaxError");
    assert.equal(e.line, 2);
    assert.match(e.message, /Unknown token nope/);
    return true;
  });
});
