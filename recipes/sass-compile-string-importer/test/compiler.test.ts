import { test } from "node:test";
import assert from "node:assert/strict";
import { compileWithModules, createMemoryImporter } from "../src/compiler.ts";

const theme = `
$primary: #336699;
$radius: 4px;

@mixin rounded($r: $radius) {
  border-radius: $r;
}
`;

test("compiles variables and mixins from an in-memory @use module", () => {
  const css = compileWithModules(
    `@use "theme";
     .button {
       color: theme.$primary;
       @include theme.rounded(8px);
     }`,
    { theme },
  );
  assert.equal(css.trim(), ".button{color:#369;border-radius:8px}");
});

test("throws on an undefined variable", () => {
  assert.throws(
    () =>
      compileWithModules(
        `@use "theme";
         .bad { color: theme.$missing; }`,
        { theme: "$primary: #336699;" },
      ),
    /Undefined variable/,
  );
});

test("canonicalize resolves known modules and rejects unknown ones", () => {
  const importer = createMemoryImporter({ theme: "$primary: red;" });
  const canonical = importer.canonicalize("theme", {} as sass.CanonicalizeContext);
  assert.equal(canonical?.pathname, "theme");
  assert.equal(importer.canonicalize("nope", {} as sass.CanonicalizeContext), null);
});
