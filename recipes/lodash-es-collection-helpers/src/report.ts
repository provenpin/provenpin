import { groupBy, keyBy, orderBy, pick, sumBy, uniqBy } from "lodash-es";

export type Row = { id: string; region: string; sku: string; qty: number; price: number };

export function summarize(rows: Row[]) {
  const unique = uniqBy(rows, "id");
  const byRegion = groupBy(unique, "region");
  const totals = Object.fromEntries(
    Object.entries(byRegion).map(([region, items]) => [
      region,
      sumBy(items, (r) => r.qty * r.price),
    ]),
  );
  const top = orderBy(unique, [(r) => r.qty * r.price], ["desc"]).slice(0, 3);
  const index = keyBy(unique, "id");
  return {
    totals,
    top: top.map((r) => pick(r, ["id", "sku", "qty", "price"])),
    get: (id: string) => index[id],
  };
}
