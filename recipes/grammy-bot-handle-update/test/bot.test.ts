import { test } from "node:test";
import assert from "node:assert/strict";
import type { Update } from "grammy/types";
import { makeBot } from "../src/bot.ts";

type Call = { method: string; payload: Record<string, unknown> };

/** Intercept every Bot API call with an API transformer, so nothing hits api.telegram.org. */
function harness() {
  const bot = makeBot("123:TEST");
  const calls: Call[] = [];
  bot.api.config.use(async (_prev, method, payload) => {
    calls.push({ method, payload: payload as Record<string, unknown> });
    const result = method === "sendMessage" ? { message_id: calls.length, date: 0, chat: { id: 1, type: "private" }, text: (payload as { text: string }).text } : true;
    return { ok: true, result } as never;
  });
  return { bot, calls };
}

let uid = 0;
const chat = { id: 1001, type: "private" as const, first_name: "JP" };
const from = { id: 1001, is_bot: false, first_name: "JP" };
const msg = (text: string): Update => {
  const isCmd = text.startsWith("/");
  return {
    update_id: ++uid,
    message: {
      message_id: uid, date: 1760000000, chat, from, text,
      ...(isCmd ? { entities: [{ type: "bot_command", offset: 0, length: text.split(" ")[0].length }] } : {}),
    },
  } as Update;
};

test("/start replies with name", async () => {
  const { bot, calls } = harness();
  await bot.handleUpdate(msg("/start"));
  assert.deepEqual(calls.map((c) => [c.method, c.payload.chat_id, c.payload.text]), [["sendMessage", 1001, "Welcome, JP!"]]);
});

test("session state persists across updates", async () => {
  const { bot, calls } = harness();
  await bot.handleUpdate(msg("/count"));
  await bot.handleUpdate(msg("/count"));
  assert.deepEqual(calls.map((c) => c.payload.text), ["Count: 1", "Count: 2"]);
});

test("plain text gets an inline keyboard", async () => {
  const { bot, calls } = harness();
  await bot.handleUpdate(msg("hello"));
  assert.deepEqual(calls[0].payload.reply_markup, { inline_keyboard: [[{ text: "Enroll", callback_data: "enroll" }]] });
});

test("callback query answers and edits", async () => {
  const { bot, calls } = harness();
  await bot.handleUpdate({
    update_id: ++uid,
    callback_query: { id: "cb1", from, chat_instance: "ci", data: "enroll", message: { message_id: 9, date: 0, chat, text: "Pick one" } },
  } as Update);
  assert.deepEqual(calls.map((c) => c.method), ["answerCallbackQuery", "editMessageText"]);
  assert.equal(calls[0].payload.text, "Enrolled");
  assert.equal(calls[1].payload.message_id, 9);
  assert.equal(calls[1].payload.text, "You're in for Nov 1st");
});
