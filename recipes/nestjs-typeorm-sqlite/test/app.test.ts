import "reflect-metadata";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.ts";

let app: INestApplication;
before(async () => {
  const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = mod.createNestApplication();
  await app.init();
});
after(() => app.close());

test("create and list", async () => {
  const c = await request(app.getHttpServer()).post("/todos").send({ title: "ship" });
  assert.equal(c.status, 201);
  assert.equal(c.body.done, false);
  assert.equal((await request(app.getHttpServer()).get("/todos")).body.length, 1);
});

test("404 and pipe validation", async () => {
  assert.equal((await request(app.getHttpServer()).get("/todos/99")).status, 404);
  assert.equal((await request(app.getHttpServer()).get("/todos/abc")).status, 400);
});
