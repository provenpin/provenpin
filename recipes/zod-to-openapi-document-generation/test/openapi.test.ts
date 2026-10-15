import { test } from "node:test";
import assert from "node:assert/strict";
import { parse } from "yaml";
import { buildDocument, toYaml, CreateUser } from "../src/openapi.ts";

const doc = buildDocument() as any;

test("document has paths, operation ids and a 3.1 header", () => {
  assert.equal(doc.openapi, "3.1.0");
  assert.deepEqual(Object.keys(doc.paths).sort(), ["/users", "/users/{id}"]);
  assert.equal(doc.paths["/users/{id}"].get.operationId, "getUser");
  assert.equal(doc.paths["/users"].post.operationId, "createUser");
});

test("registered schemas become $refs into components", () => {
  const ok = doc.paths["/users/{id}"].get.responses["200"].content["application/json"].schema;
  assert.deepEqual(ok, { $ref: "#/components/schemas/User" });
  const body = doc.paths["/users"].post.requestBody.content["application/json"].schema;
  assert.deepEqual(body, { $ref: "#/components/schemas/CreateUser" });
  assert.ok(doc.components.schemas.Problem);
});

test("zod constraints map to JSON Schema keywords", () => {
  const user = doc.components.schemas.User;
  assert.deepEqual([...user.required].sort(), ["createdAt", "email", "id", "name"]);
  assert.equal(user.properties.email.format, "email");
  assert.equal(user.properties.id.format, "uuid");
  assert.equal(user.properties.createdAt.format, "date-time");
  assert.equal(user.properties.name.maxLength, 100);
  assert.deepEqual(user.properties.role.enum, ["admin", "member"]);
  assert.equal(user.properties.role.default, "member");
  assert.equal(user.description, "A registered user");
});

test("path, query params and security are documented", () => {
  const params = doc.paths["/users/{id}"].get.parameters;
  assert.deepEqual(params, [{ $ref: "#/components/parameters/UserId" }]);
  assert.equal(doc.components.parameters.UserId.in, "path");
  const query = doc.paths["/users"].get.parameters;
  const limit = query.find((p: any) => p.name === "limit");
  assert.equal(limit.in, "query");
  assert.equal(limit.schema.maximum, 100);
  assert.deepEqual(doc.components.securitySchemes.bearerAuth, { type: "http", scheme: "bearer", bearerFormat: "JWT" });
});

test("the same schema still validates at runtime and YAML round-trips", () => {
  assert.equal(CreateUser.safeParse({ email: "not-an-email", name: "x" }).success, false);
  assert.deepEqual(CreateUser.parse({ email: "ada@example.test", name: "Ada" }), { email: "ada@example.test", name: "Ada", role: "member" });
  assert.deepEqual(parse(toYaml()), JSON.parse(JSON.stringify(doc)));
});
