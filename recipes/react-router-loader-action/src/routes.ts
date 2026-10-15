import { data, redirect, type RouteObject } from "react-router";
import { z } from "zod";

const notes = new Map<string, { id: string; title: string }>([["1", { id: "1", title: "First" }]]);
const NewNote = z.object({ title: z.string().trim().min(1, "Title required") });

export const routes: RouteObject[] = [{
  path: "/notes",
  loader: () => ({ notes: [...notes.values()] }),
  action: async ({ request }) => {
    const parsed = NewNote.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success) return data({ errors: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
    const id = String(notes.size + 1);
    notes.set(id, { id, ...parsed.data });
    return redirect(`/notes/${id}`);
  },
  children: [{
    path: ":id",
    loader: ({ params }) => {
      const note = notes.get(params.id!);
      if (!note) throw data("Note not found", { status: 404 });
      return { note };
    },
  }],
}];
