import { listRecipeIds, loadRecipe, validateRecipe } from "./lib.mjs";
let bad = 0;
for (const id of listRecipeIds()) {
  const errs = validateRecipe(loadRecipe(id));
  if (errs.length) { bad++; console.log(`INVALID ${id}\n  ${errs.join("\n  ")}`); }
}
console.log(bad ? `${bad} invalid recipe(s)` : "all recipes valid");
process.exitCode = bad ? 1 : 0;
