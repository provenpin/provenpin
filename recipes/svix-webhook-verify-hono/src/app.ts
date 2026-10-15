import { Hono } from "hono";
import { Webhook, WebhookVerificationError } from "svix";

export type Event = { type: string; data: Record<string, unknown> };

/** Hono route that verifies Svix (and Svix-style, e.g. Clerk/Resend) webhooks on the raw body. */
export function makeApp(secret: string, onEvent: (e: Event, id: string) => void) {
  const wh = new Webhook(secret);
  const seen = new Set<string>();
  const app = new Hono();
  app.post("/webhooks", async (c) => {
    const raw = await c.req.text(); // must verify the exact bytes, never re-serialized JSON
    const headers = {
      "svix-id": c.req.header("svix-id") ?? "",
      "svix-timestamp": c.req.header("svix-timestamp") ?? "",
      "svix-signature": c.req.header("svix-signature") ?? "",
    };
    let evt: Event;
    try {
      // svix 2.x verify() returns undefined (1.x returned the parsed payload), so parse after it passes.
      wh.verify(raw, headers);
      evt = JSON.parse(raw) as Event;
    } catch (e) {
      if (e instanceof WebhookVerificationError) return c.json({ error: e.message }, 400);
      throw e;
    }
    if (seen.has(headers["svix-id"])) return c.json({ ok: true, duplicate: true });
    seen.add(headers["svix-id"]);
    onEvent(evt, headers["svix-id"]);
    return c.json({ ok: true });
  });
  return app;
}
