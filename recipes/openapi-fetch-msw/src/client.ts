import createClient from "openapi-fetch";
import type { paths } from "./schema.ts";

export function createApi(baseUrl: string) {
  const client = createClient<paths>({ baseUrl });
  return {
    async list(q?: string) {
      const { data, error } = await client.GET("/items", { params: { query: { q } } });
      if (error) throw error;
      return data ?? [];
    },
    async create(name: string) {
      const { data, error, response } = await client.POST("/items", {
        body: { name },
      });
      if (error) throw error;
      if (!data) throw new Error(`create failed: ${response.status}`);
      return data;
    },
    async get(id: number) {
      const { data, error, response } = await client.GET("/items/{id}", {
        params: { path: { id } },
      });
      if (response.status === 404) throw Object.assign(new Error("not found"), { status: 404 });
      if (error) throw error;
      return data!;
    },
  };
}
