import { test } from "node:test";
import assert from "node:assert/strict";
import { bundle, evaluate, transformTs } from "../src/bundle.ts";

const files = {
  "main.ts": 'import { add } from "./math.ts";\nimport env from "env:build";\nimport { unused } from "./math.ts";\nexport const total: number = add(2, 3);\nexport const meta = env.builtAt;\nexport const DEBUG = process.env.NODE_ENV !== "production";\n',
  "math.ts": "export const add = (a: number, b: number): number => a + b;\nexport const unused = () => 'dead code';\n",
};

test("bundles virtual TS files in memory and runs them", async () => {
  const { code, inputs } = await bundle("main.ts", files, { define: { "process.env.NODE_ENV": '"production"' } });
  assert.deepEqual(inputs, ["env:env", "virtual:main.ts", "virtual:math.ts"]);
  const mod = await evaluate(code);
  assert.equal(mod.total, 5);
  assert.equal(mod.meta, "fixed");
  assert.equal(mod.DEBUG, false);
});

test("tree shaking drops unused exports", async () => {
  const { code } = await bundle("main.ts", files, { define: { "process.env.NODE_ENV": '"production"' } });
  assert.doesNotMatch(code, /dead code/);
});

test("minify plus external source map produces two outputs", async () => {
  const { code, files: outs } = await bundle("main.ts", files, { minify: true, sourcemap: "external", define: { "process.env.NODE_ENV": '"production"' } });
  assert.deepEqual(outs.sort(), ["out.js", "out.js.map"]);
  assert.ok(code.length < 200, `minified length ${code.length}`);
  assert.equal((await evaluate(code)).total, 5);
});

test("build errors are reported with location", async () => {
  await assert.rejects(bundle("main.ts", { "main.ts": "export const x = ;" }), (e: { errors: { text: string; location: { line: number } }[] }) => {
    assert.equal(e.errors[0].location.line, 1);
    assert.match(e.errors[0].text, /Unexpected/);
    return true;
  });
});

test("transform strips types only", async () => {
  const { code } = await transformTs("export const f = (x: number): string => `${x}` as string;\n");
  // esbuild hoists exports into a trailing export list
  assert.equal(code, "const f = (x) => `${x}`;\nexport {\n  f\n};\n");
});
