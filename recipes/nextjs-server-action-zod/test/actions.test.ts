import { test } from "node:test";
import assert from "node:assert/strict";
import { submitContact, sent } from "../app/contact/actions.ts";

const fd = (o: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.append(k, v); return f; };

test("valid submission", async () => {
  const r = await submitContact(null, fd({ name: " Ada ", email: "ada@example.com", message: "Hello there friend", newsletter: "on" }));
  assert.deepEqual(r, { ok: true, id: "msg_1" });
  assert.equal(sent[0].name, "Ada");
  assert.equal(sent[0].newsletter, true);
});

test("returns field errors and echoes values for the form", async () => {
  const r = await submitContact(null, fd({ name: "", email: "nope", message: "short" }));
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.deepEqual(Object.keys(r.errors).sort(), ["email", "message", "name"]);
  assert.equal(r.values?.email, "nope");
});

test("unchecked checkbox defaults to false", async () => {
  await submitContact(null, fd({ name: "Bo", email: "bo@example.com", message: "Long enough message" }));
  assert.equal(sent.at(-1)!.newsletter, false);
});
