import { describe, it, expect } from "vitest";
import { app } from "../src/app";

const post = (body: unknown) => app.request("/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

describe("valibot validation", () => {
  it("transforms and defaults", async () => {
    const r = await post({ email: "  ADA@Example.com ", password: "longenough" });
    expect(r.status).toBe(201);
    expect(await r.json()).toEqual({ email: "ada@example.com", password: "longenough", plan: "free" });
  });

  it("custom 422 with field errors", async () => {
    const r = await post({ email: "bad", password: "short", plan: "gold" });
    expect(r.status).toBe(422);
    const body = await r.json();
    expect(Object.keys(body.fields).sort()).toEqual(["email", "password", "plan"]);
  });

  it("query transform", async () => {
    expect(await (await app.request("/items?page=2")).json()).toEqual({ page: 2 });
    expect((await app.request("/items?page=0")).status).toBe(400);
  });
});
