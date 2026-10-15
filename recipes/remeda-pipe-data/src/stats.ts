import * as R from "remeda";

export type Sale = { sku: string; region: string; qty: number; price: number };

export function revenueByRegion(sales: Sale[]) {
  return R.pipe(
    sales,
    R.filter((s) => s.qty > 0),
    R.groupBy((s) => s.region),
    R.mapValues((rows) => R.sumBy(rows, (s) => s.qty * s.price)),
  );
}

export function topSkus(sales: Sale[], n: number) {
  return R.pipe(
    sales,
    R.groupBy((s) => s.sku),
    R.mapValues((rows) => R.sumBy(rows, (s) => s.qty)),
    R.entries(),
    R.sortBy([([, qty]) => qty, "desc"]),
    R.take(n),
    R.map(([sku, qty]) => ({ sku, qty })),
  );
}
