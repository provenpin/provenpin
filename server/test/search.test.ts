import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { MIN_COVERAGE, packageForms, searchRecipes, type Recipe, type RecipeIndex } from "../src/search.ts";

const mk = (id: string, title: string, summary: string, stack: string[], tags: string[], pinned: Record<string, string> = {}): Recipe => ({
  id, title, summary, language: "typescript", runtime: "node", stack, tags, pinned,
  setup: "npm i", test: "npm test", files: [],
  receipt: { status: "passed", ran_at: "2026-10-17T00:00:00Z", last_passed_at: "2026-10-17T00:00:00Z" },
});

// Trimmed copies of real recipes that compete for "JSON Schema" queries.
const index: RecipeIndex = { schema_version: 1, generated_at: "2026-10-17T00:00:00Z", count: 6, recipes: [
  mk("fastify-json-schema", "Fastify 5 routes with JSON Schema validation",
    "Fastify 5 route validation and response serialization with JSON Schema, tested via app.inject().",
    ["fastify"], ["validation", "api"], { fastify: "5.12.7", tsx: "4.23.15", "@types/node": "24.19.2" }),
  mk("json-schema-to-typescript-codegen", "Generate TypeScript types from JSON Schema with json-schema-to-typescript",
    "Compile JSON Schemas into TypeScript interfaces with json-schema-to-typescript, covering required and optional fields, enums, $ref definitions, descriptions as JSDoc and strict additionalProperties.",
    ["json-schema-to-typescript"], ["codegen", "json-schema", "types", "typescript"], { "json-schema-to-typescript": "16.0.0", tsx: "4.23.15", "@types/node": "26.6.5" }),
  mk("ajv-formats-json-schema", "Validate JSON Schema with ajv and ajv-formats",
    "Compile JSON Schema validators with ajv, add formats via ajv-formats and read errors.",
    ["ajv", "ajv-formats"], ["validation", "json-schema"], { ajv: "8.17.1", "ajv-formats": "3.0.1", tsx: "4.23.15" }),
  mk("zod-v4-json-schema-export", "Export JSON Schema from zod v4 schemas",
    "Turn zod schemas into JSON Schema with z.toJSONSchema.", ["zod"], ["json-schema", "validation"], { zod: "4.1.0", tsx: "4.23.15" }),
  mk("drizzle-pglite-migrations", "Drizzle ORM migrations on PGlite",
    "Run drizzle-kit migrations against an in-process PGlite database.", ["drizzle-orm", "@electric-sql/pglite"], ["database", "migrations"], { "drizzle-orm": "0.44.0", tsx: "4.23.15" }),
  mk("apollo-server-dataloader-batching", "Apollo Server with DataLoader batching",
    "Batch resolver lookups with dataloader under Apollo Server.", ["@apollo/server", "graphql", "dataloader"], ["graphql", "api"], { "@apollo/server": "5.0.0", tsx: "4.23.15" }),
] };
const top = (q: string, i = index) => searchRecipes(i, q)[0]?.id;

test("regression: benchmark fastify query ranks the fastify recipe over the JSON Schema codegen recipe", () => {
  const q = "TypeScript project using fastify. I need this: Fastify 5 routes with JSON Schema validation. Fastify 5 route validation and response serialization with JSON Schema, tested via app.inject(). Please write the code.";
  assert.equal(top(q), "fastify-json-schema");
  assert.equal(top("fastify json schema validation"), "fastify-json-schema");
});

test("a library named in the query beats generic words", () => {
  assert.equal(top("json schema validation with ajv"), "ajv-formats-json-schema");
  assert.equal(top("export json schema from zod"), "zod-v4-json-schema-export");
  // With no library named, the generic words still find a JSON Schema recipe.
  assert.ok(["json-schema-to-typescript-codegen", "ajv-formats-json-schema", "zod-v4-json-schema-export"].includes(top("json schema")!));
});

test("repeating a generic word does not multiply its weight", () => {
  const once = searchRecipes(index, "fastify json schema")[0];
  const many = searchRecipes(index, "fastify json schema json schema json schema JSON Schema")[0];
  assert.equal(many.id, "fastify-json-schema");
  assert.equal(many.score, once.score);
});

test("trailing sentence punctuation does not hide a library name", () => {
  const a = searchRecipes(index, "I use fastify.")[0];
  const b = searchRecipes(index, "I use fastify")[0];
  assert.equal(a.id, "fastify-json-schema");
  assert.equal(a.score, b.score);
});

test("scoped and suffixed package names match how people write them", () => {
  assert.equal(top("drizzle migrations"), "drizzle-pglite-migrations");
  assert.equal(top("apollo server batching"), "apollo-server-dataloader-batching");
  assert.deepEqual(packageForms("@types/node"), []);
  assert.deepEqual(packageForms("@apollo/server")[0], ["apollo", "server"]);
  assert.ok(packageForms("drizzle-orm").some((f) => f.join(" ") === "drizzle"));
  assert.ok(packageForms("python-dateutil").some((f) => f.join(" ") === "dateutil"));
});

test("type stubs and shared dev deps do not pull in unrelated recipes", () => {
  // Every recipe pins tsx; naming it must not outrank the recipe whose stack matches.
  assert.equal(top("tsx fastify"), "fastify-json-schema");
  // "@types/node" gets no package boost, so it scores the same as the plain words "types node".
  assert.deepEqual(searchRecipes(index, "@types/node").map((r) => [r.id, r.score]), searchRecipes(index, "types node").map((r) => [r.id, r.score]));
});

// Live index: every benchmark task query (token benchmark, 2026-10-17) must put its own recipe first.
const liveIndexPath = path.resolve(import.meta.dirname, "../../index/index.json");
test("benchmark queries: top-1 on the live index", { skip: !fs.existsSync(liveIndexPath) && "no index/index.json" }, () => {
  const live: RecipeIndex = JSON.parse(fs.readFileSync(liveIndexPath, "utf8"));
  const queries: { id: string; query: string }[] = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, "fixtures/benchmark-queries.json"), "utf8"));
  const ids = new Set(live.recipes.filter((r) => r.receipt.status === "passed").map((r) => r.id));
  const misses = queries.filter((q) => ids.has(q.id) && top(q.query, live) !== q.id).map((q) => `${q.id} -> ${top(q.query, live)}`);
  assert.deepEqual(misses, []);
});

test("no match: a query mostly about things no recipe covers returns nothing", () => {
  assert.ok(searchRecipes(index, "json schema validation").length > 0);
  // Same generic words, but the query is really about tools no recipe mentions.
  assert.deepEqual(searchRecipes(index, "json schema for eslintrc eslint flatconfig codemod prettier husky lintstaged"), []);
  // Chatter and version numbers do not count against a query.
  assert.equal(top("pls help, my fastify 5.2 json schema validation doesnt work"), "fastify-json-schema");
});

test("each result reports its coverage between 0 and 1", () => {
  const r = searchRecipes(index, "fastify json schema validation");
  assert.ok(r.every((x) => x.coverage >= 0 && x.coverage <= 1));
  assert.ok(r[0].coverage >= MIN_COVERAGE);
  assert.equal(r[0].coverage, 1);
});

test("live index: every passing recipe's own title still finds results", { skip: !fs.existsSync(liveIndexPath) && "no index/index.json" }, () => {
  const live: RecipeIndex = JSON.parse(fs.readFileSync(liveIndexPath, "utf8"));
  const empty = live.recipes.filter((r) => r.receipt.status === "passed" && !searchRecipes(live, r.title).length).map((r) => r.id);
  assert.deepEqual(empty, []);
});

test("no match never hides recipes built on a library the query names", () => {
  // Same unknown words as above, but naming ajv keeps the ajv recipe even though its coverage is low.
  const r = searchRecipes(index, "ajv for eslintrc eslint flatconfig codemod prettier husky lintstaged commitlint");
  assert.ok(r.some((x) => x.id === "ajv-formats-json-schema"));
});
