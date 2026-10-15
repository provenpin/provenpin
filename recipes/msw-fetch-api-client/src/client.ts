import { z } from "zod";

export const User = z.object({ id: z.number(), name: z.string(), email: z.email() });
export type User = z.infer<typeof User>;

export class ApiError extends Error { constructor(public status: number) { super(`HTTP ${status}`); } }

export function createClient(baseUrl: string, token: string) {
  async function call<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
    const res = await fetch(new URL(path, baseUrl), { ...init, headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...init?.headers } });
    if (!res.ok) throw new ApiError(res.status);
    return schema.parse(await res.json());
  }
  return {
    getUser: (id: number) => call(`/users/${id}`, User),
    createUser: (data: Omit<User, "id">) => call("/users", User, { method: "POST", body: JSON.stringify(data) }),
  };
}
