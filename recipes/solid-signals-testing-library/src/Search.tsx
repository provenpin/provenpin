import { createSignal, createMemo, createResource, For, Show, Suspense } from "solid-js";

export type Product = { id: number; name: string; category: string };

/** Filterable list: a signal for the query, a memo for the filtered rows. */
export function ProductFilter(props: { products: Product[] }) {
  const [query, setQuery] = createSignal("");
  const [category, setCategory] = createSignal("all");
  const categories = createMemo(() => ["all", ...new Set(props.products.map((p) => p.category))]);
  const visible = createMemo(() => props.products.filter((p) =>
    (category() === "all" || p.category === category()) && p.name.toLowerCase().includes(query().toLowerCase())));
  return (
    <div>
      <input aria-label="search" value={query()} onInput={(e) => setQuery(e.currentTarget.value)} />
      <select aria-label="category" onChange={(e) => setCategory(e.currentTarget.value)}>
        <For each={categories()}>{(c) => <option value={c}>{c}</option>}</For>
      </select>
      <Show when={visible().length > 0} fallback={<p>No matches</p>}>
        <ul><For each={visible()}>{(p) => <li>{p.name}</li>}</For></ul>
      </Show>
      <p data-testid="count">{visible().length} shown</p>
    </div>
  );
}

/** Async data with createResource: refetches whenever the source signal changes. */
export function UserCard(props: { fetchUser: (id: number) => Promise<{ name: string }> }) {
  const [id, setId] = createSignal(1);
  const [user] = createResource(id, props.fetchUser);
  return (
    <div>
      <Suspense fallback={<p>Loading</p>}>
        <h2>{user()?.name}</h2>
      </Suspense>
      <button onClick={() => setId((n) => n + 1)}>Next user</button>
    </div>
  );
}
