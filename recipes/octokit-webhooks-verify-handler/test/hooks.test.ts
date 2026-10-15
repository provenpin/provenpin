import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { Webhooks } from "@octokit/webhooks";
import { makeWebhooks, makeServer, type Seen } from "../src/hooks.ts";

const SECRET = "it's a secret to everybody";
const issuePayload = {
  action: "opened",
  issue: { number: 7, title: "Gauge broken", user: { login: "jp" } },
  repository: { full_name: "acme/app" },
  sender: { login: "jp" },
};

test("sign and verify round trip", async () => {
  const wh = new Webhooks({ secret: SECRET });
  const body = JSON.stringify(issuePayload);
  const sig = await wh.sign(body);
  assert.match(sig, /^sha256=[0-9a-f]{64}$/);
  assert.equal(await wh.verify(body, sig), true);
  assert.equal(await wh.verify(body + " ", sig), false);
});

test("verifyAndReceive dispatches to specific and onAny handlers", async () => {
  const seen: Seen = [];
  const wh = makeWebhooks(SECRET, seen);
  const payload = JSON.stringify(issuePayload);
  await wh.verifyAndReceive({ id: "d-1", name: "issues", payload, signature: await wh.sign(payload) });
  const byEvent = [...seen].sort((a, b) => a.event.localeCompare(b.event));
  assert.deepEqual(byEvent, [
    { event: "any", detail: "issues" },
    { event: "issues.opened", detail: "d-1:#7 Gauge broken" },
  ]);
});

test("bad signature is rejected", async () => {
  const wh = makeWebhooks(SECRET, []);
  const payload = JSON.stringify(issuePayload);
  await assert.rejects(wh.verifyAndReceive({ id: "d-2", name: "issues", payload, signature: "sha256=" + "0".repeat(64) }));
});

test("node middleware over real HTTP", async () => {
  const seen: Seen = [];
  const wh = makeWebhooks(SECRET, seen);
  const server = makeServer(wh).listen(0);
  await new Promise((r) => server.once("listening", r));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/github/webhooks`;
  const push = JSON.stringify({ ref: "refs/heads/main", commits: [{ id: "a" }, { id: "b" }], repository: { full_name: "acme/app" }, sender: { login: "jp" } });
  const headers = (sig: string) => ({ "content-type": "application/json", "x-github-event": "push", "x-github-delivery": "d-3", "x-hub-signature-256": sig });
  try {
    const ok = await fetch(url, { method: "POST", body: push, headers: headers(await wh.sign(push)) });
    assert.equal(ok.status, 200);
    assert.ok(seen.some((s) => s.event === "push" && s.detail === "refs/heads/main 2 commits"));
    const bad = await fetch(url, { method: "POST", body: push, headers: headers("sha256=" + "f".repeat(64)) });
    assert.equal(bad.status, 400);
    const other = await fetch(url.replace("/api/github/webhooks", "/nope"));
    assert.equal(other.status, 404);
  } finally {
    server.close();
  }
});
