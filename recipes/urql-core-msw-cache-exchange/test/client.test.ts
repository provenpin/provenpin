import { test, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { HttpResponse } from "msw";
import { graphql } from "msw/graphql"; // msw 3 moved graphql handlers to a subpath
import { setupServer } from "msw/node";
import type { CombinedError } from "@urql/core";
import { makeClient, CoursesQuery, RenameMutation } from "../src/client.ts";

const URL = "https://api.example.com/graphql";
const api = graphql.link(URL);
let hits = 0;
let lastAuth: string | null = null;
const courses = [{ __typename: "Course", id: "c1", title: "Rigging" }];

const server = setupServer(
  api.query("Courses", ({ request }) => {
    hits++;
    lastAuth = request.headers.get("authorization");
    return HttpResponse.json({ data: { courses } });
  }),
  api.mutation("Rename", ({ variables }) =>
    HttpResponse.json({ data: { renameCourse: { __typename: "Course", id: variables.id, title: variables.title } } }),
  ),
);
before(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => { server.resetHandlers(); hits = 0; });
after(() => server.close());

test("query sends auth header and returns data", async () => {
  const client = makeClient(URL, () => "tok-1");
  const r = await client.query(CoursesQuery, {}).toPromise();
  assert.equal(r.error, undefined);
  assert.deepEqual(r.data.courses, courses);
  assert.equal(lastAuth, "Bearer tok-1");
});

test("cache-first serves the second query from cache, network-only refetches", async () => {
  const client = makeClient(URL, () => "t");
  await client.query(CoursesQuery, {}).toPromise();
  const cached = await client.query(CoursesQuery, {}).toPromise();
  assert.equal(hits, 1);
  assert.equal(cached.operation.context.meta?.cacheOutcome, "hit");
  await client.query(CoursesQuery, {}, { requestPolicy: "network-only" }).toPromise();
  assert.equal(hits, 2);
});

test("mutation on a typename invalidates cached queries (document cache)", async () => {
  const client = makeClient(URL, () => "t");
  await client.query(CoursesQuery, {}).toPromise();
  const m = await client.mutation(RenameMutation, { id: "c1", title: "Rigging II" }).toPromise();
  assert.equal(m.data.renameCourse.title, "Rigging II");
  await client.query(CoursesQuery, {}).toPromise();
  assert.equal(hits, 2);
});

test("GraphQL errors become CombinedError and hit the error hook", async () => {
  server.use(api.query("Courses", () => HttpResponse.json({ errors: [{ message: "Not authorized" }] })));
  const seen: CombinedError[] = [];
  const r = await makeClient(URL, () => "bad", (e) => seen.push(e)).query(CoursesQuery, {}).toPromise();
  assert.equal(r.error?.graphQLErrors[0].message, "Not authorized");
  assert.equal(r.error?.message, "[GraphQL] Not authorized");
  assert.equal(seen.length, 1);
});

test("HTTP failures surface as networkError", async () => {
  server.use(api.query("Courses", () => new HttpResponse("upstream down", { status: 502 })));
  const r = await makeClient(URL, () => "t").query(CoursesQuery, {}).toPromise();
  assert.ok(r.error?.networkError);
});
