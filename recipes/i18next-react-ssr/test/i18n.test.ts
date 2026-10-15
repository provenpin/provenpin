import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import { createI18n } from "../src/i18n.ts";
import { Inbox } from "../src/Inbox.ts";

test("plurals, context and fallback", async () => {
  const i = await createI18n("en");
  assert.equal(i.t("inbox", { count: 1 }), "You have 1 message");
  assert.equal(i.t("inbox", { count: 5 }), "You have 5 messages");
  assert.equal(i.t("friend", { context: "female" }), "She is your friend");
  assert.equal(i.t("friend", { context: "other" }), "They are your friend");
  const fr = await createI18n("fr");
  assert.equal(fr.t("friend", { context: "male" }), "He is your friend"); // falls back to en
});

test("interpolation escapes HTML", async () => {
  const i = await createI18n("en");
  assert.equal(i.t("greeting", { name: "<b>x</b>" }), "Hello, &lt;b&gt;x&lt;&#x2F;b&gt;!");
});

test("SSR render with per-request instances", async () => {
  const [en, fr] = await Promise.all([createI18n("en"), createI18n("fr")]);
  const render = (i: any) => renderToString(h(I18nextProvider, { i18n: i }, h(Inbox, { name: "Ada", count: 2 })));
  assert.match(render(fr), /Bonjour, Ada !.*Vous avez 2 messages/);
  assert.match(render(en), /Hello, Ada!.*You have 2 messages/);
});
