import { test, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { HttpResponse } from "msw";
import { graphql } from "msw/graphql"; // msw 3 moved graphql handlers to a subpath
import { setupServer } from "msw/node";
import { client, errorCode, getRepo, star } from "../src/api.ts";

const URL_ = "https://api.example.com/graphql";
const repos: Record<string, number> = { provenpin: 5 };
const api = graphql.link(URL_); // msw 3: handlers are scoped to an endpoint
const server = setupServer(
  api.query("GetRepo", ({ variables, request }) => {
    if (request.headers.get("authorization") !== "Bearer t") return HttpResponse.json({ errors: [{ message: "nope", extensions: { code: "UNAUTHENTICATED" } }] });
    const stars = repos[variables.name as string];
    return HttpResponse.json({ data: { repo: stars === undefined ? null : { name: variables.name, stars } } });
  }),
  api.mutation("Star", ({ variables }) => HttpResponse.json({ data: { star: { name: variables.name, stars: ++repos[variables.name as string] } } })),
);
before(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
after(() => server.close());

test("query with variables", async () => {
  assert.deepEqual(await getRepo(client(URL_, "t"), "provenpin"), { name: "provenpin", stars: 5 });
  assert.equal(await getRepo(client(URL_, "t"), "missing"), null);
});

test("mutation", async () => {
  assert.equal((await star(client(URL_, "t"), "provenpin")).stars, 6);
});

test("GraphQL errors surface with their code", async () => {
  const e = await getRepo(client(URL_, "bad"), "provenpin").catch((x) => x);
  assert.equal(errorCode(e), "UNAUTHENTICATED");
});
