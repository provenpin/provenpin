import { test } from "node:test";
import assert from "node:assert/strict";
import { app } from "../src/app.ts";

test("typed route works and validates params", async () => {
  assert.deepEqual(await (await app.request("/users/u_1")).json(), { id: "u_1", name: "Ada" });
  assert.equal((await app.request("/users/u_9")).status, 404);
  assert.equal((await app.request("/users/x")).status, 400);
});

test("OpenAPI document is generated from the same schemas", async () => {
  const doc = await (await app.request("/doc")).json();
  assert.equal(doc.openapi, "3.1.0");
  assert.ok(doc.paths["/users/{id}"].get.responses["200"]);
  assert.ok(doc.components.schemas.User);
  assert.equal(doc.paths["/users/{id}"].get.parameters[0].name, "id");
});
