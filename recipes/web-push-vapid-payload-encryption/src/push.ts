import webpush, { type PushSubscription } from "web-push";

export type Vapid = { publicKey: string; privateKey: string };

export const newVapidKeys = (): Vapid => webpush.generateVAPIDKeys();

/**
 * Build the exact HTTP request web-push would send to the browser's push service
 * (encrypted aes128gcm body, VAPID Authorization, TTL/Urgency/Topic headers) without sending it.
 */
export function buildPushRequest(sub: PushSubscription, payload: object, vapid: Vapid, opts: { ttl?: number; urgency?: webpush.Urgency; topic?: string } = {}) {
  return webpush.generateRequestDetails(sub, JSON.stringify(payload), {
    vapidDetails: { subject: "mailto:ops@example.com", publicKey: vapid.publicKey, privateKey: vapid.privateKey },
    TTL: opts.ttl ?? 3600,
    urgency: opts.urgency ?? "normal",
    topic: opts.topic,
    contentEncoding: "aes128gcm",
  });
}

export const vapidHeaders = (audience: string, vapid: Vapid, expSeconds: number) =>
  webpush.getVapidHeaders(audience, "mailto:ops@example.com", vapid.publicKey, vapid.privateKey, "aes128gcm", expSeconds);
