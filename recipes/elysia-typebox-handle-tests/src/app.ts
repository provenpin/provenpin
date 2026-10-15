import { Elysia, t } from "elysia";

type Note = { id: number; title: string; body: string; tags: string[] };

export class NoteNotFound extends Error {
  status = 404;
}

/**
 * An Elysia app with TypeBox schemas on params, query, body and response. Tests call
 * app.handle(new Request(...)) with web-standard Request objects, so no port is opened
 * and the same code runs on Bun or Node.
 */
export function createApp(apiKey = "test-key") {
  const notes = new Map<number, Note>();
  let nextId = 1;

  const NoteSchema = t.Object({ id: t.Number(), title: t.String(), body: t.String(), tags: t.Array(t.String()) });

  return new Elysia()
    .error({ NOTE_NOT_FOUND: NoteNotFound }) // registered errors get their own onError code
    .onError(({ code, error, set }) => {
      if (code === "VALIDATION") { set.status = 422; return { error: "validation", detail: error.all.map((e) => ("path" in e ? e.path : "")) }; }
      if (code === "NOTE_NOT_FOUND") { set.status = 404; return { error: "note not found" }; }
    })
    .get("/health", () => ({ ok: true }))
    .guard({
      // Runs before every route in this group: a simple API key check.
      beforeHandle: ({ headers, set }) => {
        if (headers["x-api-key"] !== apiKey) { set.status = 401; return { error: "unauthorized" }; }
      },
    }, (app) => app
      .post("/notes", ({ body, set }) => {
        const note = { id: nextId++, ...body, tags: body.tags ?? [] };
        notes.set(note.id, note);
        set.status = 201;
        return note;
      }, {
        body: t.Object({ title: t.String({ minLength: 1, maxLength: 120 }), body: t.String(), tags: t.Optional(t.Array(t.String({ pattern: "^[a-z-]+$" }), { maxItems: 5 })) }),
        response: { 201: NoteSchema },
      })
      .get("/notes", ({ query }) => {
        const list = [...notes.values()].filter((n) => !query.tag || n.tags.includes(query.tag));
        return list.slice(0, query.limit);
      }, { query: t.Object({ tag: t.Optional(t.String()), limit: t.Number({ default: 10, minimum: 1, maximum: 50 }) }) })
      .get("/notes/:id", ({ params }) => {
        const n = notes.get(params.id);
        if (!n) throw new NoteNotFound(`note ${params.id}`);
        return n;
      }, { params: t.Object({ id: t.Numeric() }) }),
    );
}
