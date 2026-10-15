import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";
import http from "node:http";

export type Seen = { event: string; detail: string }[];

export function makeWebhooks(secret: string, seen: Seen) {
  const webhooks = new Webhooks({ secret });
  webhooks.on("issues.opened", ({ id, payload }) => {
    seen.push({ event: "issues.opened", detail: `${id}:#${payload.issue.number} ${payload.issue.title}` });
  });
  webhooks.on(["push"], ({ payload }) => {
    seen.push({ event: "push", detail: `${payload.ref} ${payload.commits.length} commits` });
  });
  webhooks.onAny(({ name }) => { seen.push({ event: "any", detail: String(name) }); });
  return webhooks;
}

/** Node http server that verifies X-Hub-Signature-256 and dispatches at /api/github/webhooks. */
export function makeServer(webhooks: Webhooks) {
  const middleware = createNodeMiddleware(webhooks, { path: "/api/github/webhooks" });
  return http.createServer(async (req, res) => {
    if (await middleware(req, res)) return;
    res.writeHead(404).end("not found");
  });
}
