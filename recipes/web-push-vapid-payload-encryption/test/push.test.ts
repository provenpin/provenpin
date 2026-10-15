import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import ece from "http_ece";
import { newVapidKeys, buildPushRequest, vapidHeaders } from "../src/push.ts";

const b64u = (b: Buffer) => b.toString("base64url");

/** A fake browser subscription: a real P-256 key pair and auth secret, like PushManager.subscribe() makes. */
function fakeBrowser() {
  const ecdh = crypto.createECDH("prime256v1");
  ecdh.generateKeys();
  const auth = crypto.randomBytes(16);
  return {
    ecdh, auth,
    sub: { endpoint: "https://fcm.googleapis.com/fcm/send/abc123", keys: { p256dh: b64u(ecdh.getPublicKey()), auth: b64u(auth) } },
  };
}

test("VAPID keys are P-256 base64url", () => {
  const k = newVapidKeys();
  assert.equal(Buffer.from(k.publicKey, "base64url").length, 65);
  assert.equal(Buffer.from(k.privateKey, "base64url").length, 32);
});

test("request details: endpoint, headers, encrypted body", () => {
  const vapid = newVapidKeys();
  const { sub } = fakeBrowser();
  const req = buildPushRequest(sub, { title: "Class moved", body: "Nov 1st" }, vapid, { ttl: 60, urgency: "high", topic: "schedule" });
  assert.equal(req.method, "POST");
  assert.equal(req.endpoint, sub.endpoint);
  assert.equal(req.headers.TTL, 60);
  assert.equal(req.headers.Urgency, "high");
  assert.equal(req.headers.Topic, "schedule");
  assert.equal(req.headers["Content-Encoding"], "aes128gcm");
  assert.equal(req.headers["Content-Type"], "application/octet-stream");
  assert.match(String(req.headers.Authorization), /^vapid t=[\w-]+\.[\w-]+\.[\w-]+, k=[\w-]+$/);
  assert.ok(!Buffer.from(req.body!).toString("latin1").includes("Class moved"), "payload must be encrypted");
});

test("browser side can decrypt the payload", () => {
  const vapid = newVapidKeys();
  const b = fakeBrowser();
  const req = buildPushRequest(b.sub, { title: "Class moved", body: "Nov 1st" }, vapid);
  const plain = ece.decrypt(Buffer.from(req.body!), { version: "aes128gcm", privateKey: b.ecdh, authSecret: b64u(b.auth) });
  assert.deepEqual(JSON.parse(plain.toString("utf8")), { title: "Class moved", body: "Nov 1st" });
});

test("a different subscriber cannot decrypt", () => {
  const vapid = newVapidKeys();
  const a = fakeBrowser(), other = fakeBrowser();
  const req = buildPushRequest(a.sub, { x: 1 }, vapid);
  assert.throws(() => ece.decrypt(Buffer.from(req.body!), { version: "aes128gcm", privateKey: other.ecdh, authSecret: b64u(other.auth) }));
});

test("VAPID JWT verifies with the public key and carries aud/exp/sub", () => {
  const vapid = newVapidKeys();
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const { Authorization } = vapidHeaders("https://fcm.googleapis.com", vapid, exp);
  const [, jwt, k] = /^vapid t=([^,]+), k=(.+)$/.exec(Authorization)!;
  assert.equal(k, vapid.publicKey);
  const [h, p, s] = jwt.split(".");
  assert.deepEqual(JSON.parse(Buffer.from(h, "base64url").toString()), { typ: "JWT", alg: "ES256" });
  assert.deepEqual(JSON.parse(Buffer.from(p, "base64url").toString()), { aud: "https://fcm.googleapis.com", exp, sub: "mailto:ops@example.com" });
  const raw = Buffer.from(vapid.publicKey, "base64url");
  const key = crypto.createPublicKey({ format: "jwk", key: { kty: "EC", crv: "P-256", x: b64u(raw.subarray(1, 33)), y: b64u(raw.subarray(33)) } });
  const ok = crypto.verify("sha256", Buffer.from(`${h}.${p}`), { key, dsaEncoding: "ieee-p1363" }, Buffer.from(s, "base64url"));
  assert.equal(ok, true);
});
