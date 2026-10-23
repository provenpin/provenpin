import { test, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { makeClient, listOpenIssues, firstWithLabel, openIssue, repoExists } from "../src/github.ts";

const API = "https://api.github.com";
const all = [
  { number: 1, title: "one", labels: [] },
  { number: 2, title: "two (pr)", labels: [], pull_request: { url: "x" } },
  { number: 3, title: "three", labels: [{ name: "bug" }] },
  { number: 4, title: "four", labels: [] },
  { number: 5, title: "five", labels: [{ name: "docs" }] },
];
const pagesServed: number[] = [];

const server = setupServer(
  http.get(`${API}/repos/acme/app/issues`, ({ request }) => {
    const u = new URL(request.url);
    const page = Number(u.searchParams.get("page") ?? 1), per = Number(u.searchParams.get("per_page"));
    pagesServed.push(page);
    const last = Math.ceil(all.length / per);
    const link = (p: number, rel: string) => `<${API}/repos/acme/app/issues?per_page=${per}&page=${p}>; rel="${rel}"`;
    const links = [page < last && link(page + 1, "next"), link(last, "last")].filter(Boolean).join(", ");
    return HttpResponse.json(all.slice((page - 1) * per, page * per), { headers: { link: links } });
  }),
  http.post(`${API}/repos/acme/app/issues`, async ({ request }) => {
    assert.equal(request.headers.get("authorization"), "token test-token");
    const body = (await request.json()) as { title: string; labels: string[] };
    return HttpResponse.json({ number: 42, title: body.title, labels: body.labels, html_url: "https://github.com/acme/app/issues/42" }, { status: 201 });
  }),
  http.get(`${API}/repos/acme/:repo`, ({ params }) =>
    params.repo === "app" ? HttpResponse.json({ id: 1, name: "app" }) : HttpResponse.json({ message: "Not Found" }, { status: 404 }),
  ),
);

before(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => { server.resetHandlers(); pagesServed.length = 0; });
after(() => server.close());

test("paginate follows Link headers across all pages", async () => {
  const issues = await listOpenIssues(makeClient("test-token"), "acme", "app");
  assert.deepEqual(issues.map((i) => i.number), [1, 3, 4, 5]);
  assert.deepEqual(pagesServed, [1, 2, 3]);
});

test("done() stops paging early", async () => {
  assert.equal(await firstWithLabel(makeClient("t"), "acme", "app", "bug"), 3);
  assert.deepEqual(pagesServed, [1, 2]);
});

test("create sends auth and JSON body", async () => {
  assert.deepEqual(await openIssue(makeClient("test-token"), "acme", "app", "Broken link", ["bug"]), {
    status: 201, number: 42, url: "https://github.com/acme/app/issues/42",
  });
});

test("404 surfaces as RequestError status", async () => {
  const gh = makeClient("t");
  assert.equal(await repoExists(gh, "acme", "app"), true);
  assert.equal(await repoExists(gh, "acme", "gone"), false);
});
