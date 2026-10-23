import { ofetch, type FetchOptions } from "ofetch";

export type Item = { id: number; name: string };

export function createClient(baseURL: string, fetchImpl?: typeof fetch) {
  const api = ofetch.create({ baseURL }, { fetch: fetchImpl });
  return {
    list: (q?: string) => api<Item[]>("/items", { query: q ? { q } : undefined }),
    get: (id: number) => api<Item>(`/items/${id}`),
    create: (name: string) => api<Item>("/items", { method: "POST", body: { name } }),
  };
}

export type Client = ReturnType<typeof createClient>;
