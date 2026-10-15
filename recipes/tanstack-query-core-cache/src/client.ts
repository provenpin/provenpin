import { QueryClient, QueryObserver, type QueryKey } from "@tanstack/query-core";

export type Item = { id: number; name: string };

export function createItemsClient(fetchItem: (id: number) => Promise<Item>) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 1_000 },
    },
  });

  const key = (id: number): QueryKey => ["item", id];

  return {
    client,
    async get(id: number) {
      return client.fetchQuery({
        queryKey: key(id),
        queryFn: () => fetchItem(id),
      });
    },
    getCached(id: number) {
      return client.getQueryData<Item>(key(id));
    },
    async invalidate(id: number) {
      await client.invalidateQueries({ queryKey: key(id) });
    },
    observe(id: number, onChange: (item: Item | undefined) => void) {
      const observer = new QueryObserver(client, {
        queryKey: key(id),
        queryFn: () => fetchItem(id),
      });
      return observer.subscribe((result) => onChange(result.data));
    },
  };
}
