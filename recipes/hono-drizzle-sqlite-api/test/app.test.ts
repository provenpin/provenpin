import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../src/app";

let app: ReturnType<typeof createApp>;
const json = (method: string, body: unknown) => ({ method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => { app = createApp(); });

describe("tasks api", () => {
  it("creates, updates, lists and deletes", async () => {
    const created = await (await app.request("/tasks", json("POST", { title: "write recipe" }))).json();
    expect(created).toEqual({ id: 1, title: "write recipe", done: false });
    const updated = await (await app.request("/tasks/1", json("PATCH", { done: true }))).json();
    expect(updated.done).toBe(true);
    expect(await (await app.request("/tasks")).json()).toHaveLength(1);
    expect((await app.request("/tasks/1", { method: "DELETE" })).status).toBe(204);
  });

  it("validates body and params", async () => {
    expect((await app.request("/tasks", json("POST", { title: "" }))).status).toBe(400);
    expect((await app.request("/tasks/abc", json("PATCH", { done: true }))).status).toBe(400);
  });

  it("404s on missing rows", async () => {
    expect((await app.request("/tasks/99", json("PATCH", { done: true }))).status).toBe(404);
    expect((await app.request("/tasks/99", { method: "DELETE" })).status).toBe(404);
  });
});
