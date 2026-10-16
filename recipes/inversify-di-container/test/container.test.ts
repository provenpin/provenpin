import "reflect-metadata";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createContainer,
  TYPES,
  ConsoleLogger,
  DefaultUserService,
  InMemoryUserRepository,
  type Logger,
  type UserRepository,
  type UserService,
} from "../src/container.ts";

test("singleton bindings resolve to the same instance", () => {
  const container = createContainer();
  const logger1 = container.get<Logger>(TYPES.Logger);
  const logger2 = container.get<Logger>(TYPES.Logger);
  assert.equal(logger1, logger2);
  const repo1 = container.get<UserRepository>(TYPES.UserRepository);
  const repo2 = container.get<UserRepository>(TYPES.UserRepository);
  assert.equal(repo1, repo2);
});

test("transient bindings resolve to new instances", () => {
  const container = createContainer();
  const service1 = container.get<UserService>(TYPES.UserService);
  const service2 = container.get<UserService>(TYPES.UserService);
  assert.notEqual(service1, service2);
});

test("injects dependencies into the resolved service", () => {
  const container = createContainer();
  const service = container.get<UserService>(TYPES.UserService);
  assert.equal(service.greet("1"), "Hello Ada");
  assert.equal(service.greet("nope"), "unknown");
  const logger = container.get<ConsoleLogger>(TYPES.Logger);
  assert.deepEqual(logger.lines, ["greet 1", "missing nope"]);
});

test("interfaces resolve to their bound implementations", () => {
  const container = createContainer();
  assert.ok(
    container.get<UserService>(TYPES.UserService) instanceof DefaultUserService,
  );
  assert.ok(
    container.get<UserRepository>(TYPES.UserRepository) instanceof
      InMemoryUserRepository,
  );
});
