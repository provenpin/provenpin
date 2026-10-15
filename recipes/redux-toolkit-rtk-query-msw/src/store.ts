import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query";

export type Todo = { id: number; title: string; done: boolean };

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://api.example.test/",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Todo"],
  endpoints: (b) => ({
    getTodos: b.query<Todo[], void>({
      query: () => "todos",
      providesTags: (r) => [...(r ?? []).map(({ id }) => ({ type: "Todo" as const, id })), { type: "Todo" as const, id: "LIST" }],
    }),
    addTodo: b.mutation<Todo, { title: string }>({
      query: (body) => ({ url: "todos", method: "POST", body }),
      invalidatesTags: [{ type: "Todo", id: "LIST" }], // refetch the list after a create
    }),
    toggleTodo: b.mutation<Todo, Todo>({
      query: (t) => ({ url: `todos/${t.id}`, method: "PATCH", body: { done: !t.done } }),
      // Optimistic update: flip the cached item now, undo if the server says no.
      async onQueryStarted(t, { dispatch, queryFulfilled }) {
        const patch = dispatch(api.util.updateQueryData("getTodos", undefined, (draft) => {
          const item = draft.find((d) => d.id === t.id);
          if (item) item.done = !t.done;
        }));
        try { await queryFulfilled; } catch { patch.undo(); }
      },
    }),
  }),
});

const auth = createSlice({
  name: "auth",
  initialState: { token: null as string | null },
  reducers: { signedIn: (s, a: PayloadAction<string>) => { s.token = a.payload; } },
});
export const { signedIn } = auth.actions;

export function makeStore() {
  return configureStore({
    reducer: { auth: auth.reducer, [api.reducerPath]: api.reducer },
    middleware: (gdm) => gdm().concat(api.middleware),
  });
}
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
