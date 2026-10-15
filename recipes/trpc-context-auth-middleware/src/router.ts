import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

export type Context = { user: { id: string; role: "admin" | "user" } | null };
const t = initTRPC.context<Context>().create();

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { user: ctx.user } }); // narrows user to non-null downstream
});
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next();
});

const notes: { id: number; owner: string; text: string }[] = [];

export const appRouter = t.router({
  health: publicProcedure.query(() => "ok"),
  addNote: protectedProcedure.input(z.object({ text: z.string().min(1).max(280) })).mutation(({ ctx, input }) => {
    const note = { id: notes.length + 1, owner: ctx.user.id, text: input.text };
    notes.push(note);
    return note;
  }),
  myNotes: protectedProcedure.query(({ ctx }) => notes.filter((n) => n.owner === ctx.user.id)),
  allNotes: adminProcedure.query(() => notes),
});
export type AppRouter = typeof appRouter;
export const createCaller = t.createCallerFactory(appRouter);
