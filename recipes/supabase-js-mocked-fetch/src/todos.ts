import type { SupabaseClient } from "@supabase/supabase-js";

export type Todo = { id: number; title: string; done: boolean; user_id: string };

export async function openTodos(sb: SupabaseClient, userId: string): Promise<Todo[]> {
  const { data, error } = await sb.from("todos").select("id,title,done,user_id").eq("user_id", userId).eq("done", false).order("id");
  if (error) throw new Error(error.message);
  return data as Todo[];
}

export async function addTodo(sb: SupabaseClient, userId: string, title: string): Promise<Todo> {
  const { data, error } = await sb.from("todos").insert({ title, user_id: userId }).select().single();
  if (error) throw new Error(error.message);
  return data as Todo;
}

export async function signIn(sb: SupabaseClient, email: string, password: string) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user?.id;
}
