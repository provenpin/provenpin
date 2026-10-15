import { create, all } from "mathjs";

/** Number-based instance with import and createUnit disabled, for evaluating untrusted formulas. */
export const math = create(all);
const limitedEvaluate = math.evaluate;
math.import(
  {
    import: () => { throw new Error("Function import is disabled"); },
    createUnit: () => { throw new Error("Function createUnit is disabled"); },
  },
  { override: true },
);

export const big = create(all, { number: "BigNumber", precision: 40 });

export function evalFormula(expr: string, scope: Record<string, number> = {}): number {
  const r = limitedEvaluate(expr, { ...scope });
  if (typeof r !== "number") throw new Error(`expected a number, got ${math.typeOf(r)}`);
  return r;
}

export function convert(value: string, to: string, digits = 4): number {
  return Number(math.unit(value).toNumber(to).toFixed(digits));
}

export function compileRule(expr: string) {
  const code = math.compile(expr);
  return (scope: Record<string, number>) => code.evaluate({ ...scope }) as number;
}

export function exactSum(values: string[]): string {
  return big.format(values.reduce((s, v) => big.add(s, big.bignumber(v)), big.bignumber(0)));
}
