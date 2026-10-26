import { Bot, Context, session, type SessionFlavor } from "grammy";

type SessionData = { count: number };
export type MyContext = Context & SessionFlavor<SessionData>;

export function makeBot(token: string) {
  // botInfo up front means no getMe network call at init.
  const bot = new Bot<MyContext>(token, {
    botInfo: {
      id: 42, is_bot: true, first_name: "Demo Bot", username: "demo_test_bot",
      can_join_groups: true, can_read_all_group_messages: false, supports_inline_queries: false,
      can_connect_to_business: false, has_main_web_app: false, has_topics_enabled: false,
      allows_users_to_create_topics: false, can_manage_bots: false, supports_join_request_queries: false,
    },
  });
  bot.use(session({ initial: (): SessionData => ({ count: 0 }) }));
  bot.command("start", (ctx) => ctx.reply(`Welcome, ${ctx.from?.first_name}!`));
  bot.command("count", (ctx) => {
    ctx.session.count++;
    return ctx.reply(`Count: ${ctx.session.count}`);
  });
  bot.callbackQuery("enroll", async (ctx) => {
    await ctx.answerCallbackQuery({ text: "Enrolled" });
    await ctx.editMessageText("You're in for Nov 1st");
  });
  bot.on("message:text", (ctx) =>
    ctx.reply("Pick one", { reply_markup: { inline_keyboard: [[{ text: "Enroll", callback_data: "enroll" }]] } }),
  );
  bot.catch((err) => { throw err.error; });
  return bot;
}
