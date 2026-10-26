import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import twilio from "twilio";
import { makeApp } from "../src/app.ts";

const TOKEN = "12345abcdef12345abcdef12345abcde";
const BASE = "https://example.ngrok.app";
const params = { From: "+19075550100", To: "+19075550199", Body: "status", MessageSid: "SM123" };

const sign = (url: string, p: Record<string, string>) => twilio.getExpectedTwilioSignature(TOKEN, url, p);

test("signature helper matches validateRequest", () => {
  const sig = sign(`${BASE}/sms`, params);
  assert.equal(twilio.validateRequest(TOKEN, sig, `${BASE}/sms`, params), true);
  assert.equal(twilio.validateRequest(TOKEN, sig, `${BASE}/other`, params), false);
});

test("valid webhook gets TwiML reply", async () => {
  const res = await request(makeApp(TOKEN, BASE))
    .post("/sms")
    .type("form")
    .set("X-Twilio-Signature", sign(`${BASE}/sms`, params))
    .send(params);
  assert.equal(res.status, 200);
  assert.match(res.headers["content-type"], /text\/xml/);
  assert.equal(res.text, '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Class starts Nov 1st</Message></Response>');
});

test("query string is part of the signed URL", async () => {
  const sig = sign(`${BASE}/sms?tenant=acme`, { ...params, Body: "hi" });
  const ok = await request(makeApp(TOKEN, BASE)).post("/sms?tenant=acme").type("form").set("X-Twilio-Signature", sig).send({ ...params, Body: "hi" });
  assert.equal(ok.status, 200);
  assert.match(ok.text, /<Message>Got: hi<\/Message>/);
});

test("tampered params are rejected", async () => {
  const res = await request(makeApp(TOKEN, BASE))
    .post("/sms")
    .type("form")
    .set("X-Twilio-Signature", sign(`${BASE}/sms`, params))
    .send({ ...params, Body: "something else" });
  assert.equal(res.status, 403);
});

test("wrong token or missing header is rejected", async () => {
  const wrong = twilio.getExpectedTwilioSignature("x".repeat(32), `${BASE}/sms`, params);
  const app = makeApp(TOKEN, BASE);
  assert.equal((await request(app).post("/sms").type("form").set("X-Twilio-Signature", wrong).send(params)).status, 403);
  assert.equal((await request(app).post("/sms").type("form").send(params)).status, 403);
});
