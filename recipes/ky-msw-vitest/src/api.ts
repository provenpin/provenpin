import ky from "ky";

export function createApi(prefixUrl: string, getToken: () => string) {
  return ky.create({
    prefix: prefixUrl,
    timeout: 5000,
    retry: { limit: 2, methods: ["get"], statusCodes: [500, 502, 503, 504], backoffLimit: 0 },
    hooks: {
      beforeRequest: [({ request }) => { request.headers.set("authorization", `Bearer ${getToken()}`); }],
    },
  });
}

export type Repo = { id: number; name: string; stars: number };
export const getRepo = (api: ReturnType<typeof createApi>, name: string) => api.get(`repos/${name}`).json<Repo>();
