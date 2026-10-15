import { describe, it, expect } from "vitest";
import { isActionFailure, isRedirect } from "@sveltejs/kit";
import { actions } from "../src/routes/signup/+page.server";

function event(fields: Record<string, string>) {
  const jar = new Map<string, string>();
  const ev = { request: new Request("http://app/signup", { method: "POST", body: new URLSearchParams(fields) }), cookies: { set: (k: string, v: string) => jar.set(k, v) } } as any;
  return { ev, jar };
}

describe("signup action", () => {
  it("fails with field errors and no password echo", async () => {
    const r: any = await actions.default(event({ email: "bad", password: "123" }).ev);
    expect(isActionFailure(r)).toBe(true);
    expect(r.status).toBe(400);
    expect(Object.keys(r.data.errors).sort()).toEqual(["email", "password"]);
    expect(r.data.password).toBeUndefined();
  });

  it("sets a cookie and redirects with 303", async () => {
    const { ev, jar } = event({ email: "a@example.com", password: "longenough" });
    const err = await actions.default(ev).catch((e) => e);
    expect(isRedirect(err)).toBe(true);
    expect(err.status).toBe(303);
    expect(err.location).toBe("/welcome");
    expect(jar.get("session")).toBe("s_1");
  });

  it("409 on duplicate email", async () => {
    const r: any = await actions.default(event({ email: "a@example.com", password: "longenough" }).ev);
    expect(r.status).toBe(409);
  });
});
