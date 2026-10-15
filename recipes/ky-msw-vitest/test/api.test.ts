import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { HTTPError } from "ky";
import { createApi, getRepo } from "../src/api";

const BASE = "https://api.example.com";
let calls = 0;
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => { server.resetHandlers(); calls = 0; });
afterAll(() => server.close());
const api = createApi(BASE, () => "tok");

describe("ky client", () => {
  it("sends auth and parses json", async () => {
    server.use(http.get(`${BASE}/repos/:name`, ({ params, request }) => {
      expect(request.headers.get("authorization")).toBe("Bearer tok");
      return HttpResponse.json({ id: 1, name: params.name, stars: 5 });
    }));
    expect(await getRepo(api, "pp")).toEqual({ id: 1, name: "pp", stars: 5 });
  });

  it("retries 503 then succeeds", async () => {
    server.use(http.get(`${BASE}/repos/:name`, () => (++calls < 3 ? new HttpResponse(null, { status: 503 }) : HttpResponse.json({ id: 2, name: "x", stars: 0 }))));
    expect((await getRepo(api, "x")).id).toBe(2);
    expect(calls).toBe(3);
  });

  it("throws HTTPError on 404 without retrying", async () => {
    server.use(http.get(`${BASE}/repos/:name`, () => { calls++; return new HttpResponse(null, { status: 404 }); }));
    await expect(getRepo(api, "nope")).rejects.toBeInstanceOf(HTTPError);
    expect(calls).toBe(1);
  });
});
