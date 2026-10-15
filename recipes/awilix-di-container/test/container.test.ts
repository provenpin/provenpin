import { test } from "node:test";
import assert from "node:assert/strict";
import { asValue } from "awilix";
import { buildContainer, handleRequest, Database } from "../src/container.ts";

test("resolves the dependency graph", () => {
  const c = buildContainer();
  assert.deepEqual(handleRequest(c, "req-1", 1), { requestId: "req-1", user: { id: 1, name: "Ada" } });
  assert.equal(c.resolve("greeter")("Bob"), "provenpin says hi to Bob");
});

test("lifetimes: singletons shared, scoped per scope, transient always new", () => {
  const c = buildContainer();
  const a = c.createScope();
  const b = c.createScope();
  assert.equal(a.resolve("db"), b.resolve("db"));
  assert.equal(a.resolve("userService"), a.resolve("userService"));
  assert.notEqual(a.resolve("userService"), b.resolve("userService"));
  assert.notEqual(c.resolve("greeter"), c.resolve("greeter"));
});

test("overrides for tests replace a registration", () => {
  const c = buildContainer();
  const fake = new Database();
  fake.rows.set(1, { id: 1, name: "Fake" });
  c.register({ db: asValue(fake) });
  assert.equal(handleRequest(c, "t", 1).user?.name, "Fake");
});

test("dispose runs disposers for resolved singletons", async () => {
  const c = buildContainer();
  const db = c.resolve("db");
  await c.dispose();
  assert.equal(db.closed, true);
});

test("strict mode reports missing registrations", () => {
  const c = buildContainer();
  assert.throws(() => c.resolve("missing" as never), /Could not resolve 'missing'/);
});
