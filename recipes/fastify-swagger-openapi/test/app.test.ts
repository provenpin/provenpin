import { test } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../src/app.ts";

test("generates an OpenAPI 3.1 document from route schemas", async () => {
  const app = await buildApp();
  const doc = app.swagger() as any;
  assert.equal(doc.openapi, "3.1.0");
  assert.equal(doc.info.title, "Parts API");
  assert.deepEqual(Object.keys(doc.paths).sort(), ["/parts"]);
  assert.equal(doc.paths["/parts"].get.summary, "List parts");
  assert.deepEqual(doc.paths["/parts"].post.security, [{ bearerAuth: [] }]);
  assert.equal(doc.paths["/parts"].get.parameters[0].name, "q");
  assert.deepEqual(doc.components.schemas.Part.required, ["id", "name"]);
  assert.equal(doc.paths["/parts"].post.responses["201"].content["application/json"].schema.$ref, "#/components/schemas/Part");
  assert.equal(doc.components.securitySchemes.bearerAuth.scheme, "bearer");
  await app.close();
});

test("serves the document and hides the docs route itself", async () => {
  const app = await buildApp();
  const res = await app.inject({ method: "GET", url: "/openapi.json" });
  assert.equal(res.statusCode, 200);
  const doc = res.json();
  assert.equal(doc.paths["/openapi.json"], undefined);
  await app.close();
});

test("the same schemas validate requests", async () => {
  const app = await buildApp();
  const bad = await app.inject({ method: "POST", url: "/parts", payload: { name: "" } });
  assert.equal(bad.statusCode, 400);
  const ok = await app.inject({ method: "POST", url: "/parts", payload: { name: "nut", price: 0.1 } });
  assert.equal(ok.statusCode, 201);
  assert.deepEqual(ok.json(), { id: 2, name: "nut", price: 0.1 });
  await app.close();
});
