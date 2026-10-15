import { test, before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { Resend } from "resend";
import { sendWelcome } from "../src/mailer.ts";

let lastBody: any;
const server = setupServer(http.post("https://api.resend.com/emails", async ({ request }) => {
  lastBody = await request.json();
  if (request.headers.get("authorization") !== "Bearer re_test") return HttpResponse.json({ statusCode: 401, name: "validation_error", message: "API key is invalid" }, { status: 401 });
  return HttpResponse.json({ id: "email_123" });
}));
before(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
after(() => server.close());

test("sends html, text and tags", async () => {
  assert.equal(await sendWelcome(new Resend("re_test"), "a@example.com", "Ada<script>"), "email_123");
  assert.equal(lastBody.subject, "Welcome, Adascript!");
  assert.deepEqual(lastBody.to, ["a@example.com"]);
  assert.ok(lastBody.text && lastBody.html);
  assert.deepEqual(lastBody.tags, [{ name: "category", value: "welcome" }]);
});

test("API errors are thrown with the message", async () => {
  await assert.rejects(sendWelcome(new Resend("re_bad"), "a@example.com", "Ada"), /API key is invalid/);
});
