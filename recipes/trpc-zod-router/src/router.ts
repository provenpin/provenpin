import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

type Context = { userId: string | null };
const t = initTRPC.context<Context>().create();

const authed = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { userId: ctx.userId } });
});

const notes: { id: number; owner: string; text: string }[] = [];

export const appRouter = t.router({
  hello: t.procedure.input(z.object({ name: z.string() })).query(({ input }) => `hello ${input.name}`),
  addNote: authed.input(z.object({ text: z.string().min(1) })).mutation(({ ctx, input }) => {
    const note = { id: notes.length + 1, owner: ctx.userId, text: input.text };
    notes.push(note);
    return note;
  }),
});
export type AppRouter = typeof appRouter;
export const createCaller = t.createCallerFactory(appRouter);
