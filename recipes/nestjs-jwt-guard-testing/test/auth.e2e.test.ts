import "reflect-metadata";
import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { AppModule } from "../src/app.module.ts";

async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

test("protected route returns 401 without a token", async (t) => {
  const app = await createApp();
  t.after(async () => {
    await app.close();
  });

  await request(app.getHttpServer()).get("/profile").expect(401);
});

test("login issues a JWT and the guard accepts it", async (t) => {
  const app = await createApp();
  t.after(async () => {
    await app.close();
  });

  const login = await request(app.getHttpServer())
    .post("/login")
    .send({ username: "ada" })
    .expect(201);

  assert.equal(typeof login.body.access_token, "string");
  assert.ok(login.body.access_token.length > 0);

  const profile = await request(app.getHttpServer())
    .get("/profile")
    .set("Authorization", `Bearer ${login.body.access_token}`)
    .expect(200);

  assert.equal(profile.body.user.username, "ada");
});
