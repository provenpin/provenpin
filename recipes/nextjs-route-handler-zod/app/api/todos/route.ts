import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const CreateTodo = z.object({ title: z.string().trim().min(1).max(120), done: z.boolean().default(false) });
const ListQuery = z.object({ limit: z.coerce.number().int().min(1).max(50).default(10) });

const todos: { id: number; title: string; done: boolean }[] = [];

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const parsed = CreateTodo.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body", issues: z.flattenError(parsed.error).fieldErrors }, { status: 400 });
  const todo = { id: todos.length + 1, ...parsed.data };
  todos.push(todo);
  return NextResponse.json(todo, { status: 201 });
}

export async function GET(req: NextRequest) {
  const q = ListQuery.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!q.success) return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  return NextResponse.json(todos.slice(0, q.data.limit));
}
