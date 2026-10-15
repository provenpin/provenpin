import { initTRPC } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { z } from "zod";

const t = initTRPC.create({ transformer: superjson });
const events: { name: string; at: Date }[] = [];

export const appRouter = t.router({
  addEvent: t.procedure.input(z.object({ name: z.string().min(1), at: z.date() })).mutation(({ input }) => {
    events.push(input);
    return { count: events.length };
  }),
  nextEvent: t.procedure.query(() => events.toSorted((a, b) => a.at.getTime() - b.at.getTime())[0] ?? null),
  tally: t.procedure.query(() => new Map(events.map((e) => [e.name, e.at]))),
});
export type AppRouter = typeof appRouter;

export const handler = (req: Request) => fetchRequestHandler({ endpoint: "/trpc", req, router: appRouter, createContext: () => ({}) });
