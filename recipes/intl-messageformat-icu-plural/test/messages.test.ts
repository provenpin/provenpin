import { test } from "node:test";
import assert from "node:assert/strict";
import { formatMessage } from "../src/messages.ts";

test("plural selects =0, one and other in en", () => {
  assert.equal(formatMessage("en", "attachments", { count: 0 }), "No attachments");
  assert.equal(formatMessage("en", "attachments", { count: 1 }), "1 attachment");
  assert.equal(formatMessage("en", "attachments", { count: 5 }), "5 attachments");
});

test("plural applies French categories with =0 override", () => {
  assert.equal(formatMessage("fr", "attachments", { count: 0 }), "Aucune piece jointe");
  assert.equal(formatMessage("fr", "attachments", { count: 1 }), "1 piece jointe");
  assert.equal(formatMessage("fr", "attachments", { count: 3 }), "3 pieces jointes");
});

test("select picks a branch by gender and falls back to other", () => {
  assert.equal(formatMessage("en", "reply", { gender: "male" }), "He replied");
  assert.equal(formatMessage("en", "reply", { gender: "female" }), "She replied");
  assert.equal(formatMessage("en", "reply", { gender: "unknown" }), "They replied");
  assert.equal(formatMessage("fr", "reply", { gender: "female" }), "Elle a repondu");
});

test("number formatting differs between locales", () => {
  assert.equal(formatMessage("en", "price", { amount: 3.5 }), "Total: 3.5");
  assert.equal(formatMessage("fr", "price", { amount: 3.5 }), "Total : 3,5");
});

test("date formatting uses locale order with UTC override", () => {
  const when = new Date("2024-01-15T00:00:00.000Z");
  assert.equal(formatMessage("en", "due", { when }), "Due on 01/15/2024");
  assert.equal(formatMessage("fr", "due", { when }), "Echeance le 15/01/2024");
});

test("nested select and plural resolve inner arguments", () => {
  assert.equal(
    formatMessage("en", "inbox", { gender: "male", count: 3 }),
    "He has 3 messages",
  );
  assert.equal(
    formatMessage("en", "inbox", { gender: "female", count: 1 }),
    "She has 1 message",
  );
  assert.equal(
    formatMessage("en", "inbox", { gender: "unknown", count: 0 }),
    "They have no messages",
  );
  assert.equal(
    formatMessage("fr", "inbox", { gender: "female", count: 2 }),
    "Elle a 2 messages",
  );
});

test("rich text tags call the matching formatter function", () => {
  const bold = (chunks: unknown) => `[${chunks}]`;
  assert.equal(
    formatMessage("en", "banner", { topic: "pricing", b: bold }),
    "Read [pricing] now",
  );
  assert.equal(
    formatMessage("fr", "banner", { topic: "tarifs", b: bold }),
    "Lire [tarifs] maintenant",
  );
});
