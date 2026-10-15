import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Api = { list: () => Promise<string[]>; add: (t: string) => Promise<void> };

export function useTodos(api: Api) {
  return useQuery({ queryKey: ["todos"], queryFn: api.list });
}

export function Todos({ api }: { api: Api }) {
  const qc = useQueryClient();
  const todos = useTodos(api);
  const add = useMutation({ mutationFn: api.add, onSuccess: () => qc.invalidateQueries({ queryKey: ["todos"] }) });
  if (todos.isPending) return <p>Loading...</p>;
  if (todos.isError) return <p role="alert">Error: {todos.error.message}</p>;
  return (
    <div>
      <ul>{todos.data.map((t) => <li key={t}>{t}</li>)}</ul>
      <button onClick={() => add.mutate("new")}>Add</button>
    </div>
  );
}
