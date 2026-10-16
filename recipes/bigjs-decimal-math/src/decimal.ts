import Big from "big.js";

export const RoundingMode = {
  down: 0,
  halfUp: 1,
  halfEven: 2,
  up: 3,
} as const;

export type RoundingMode = (typeof RoundingMode)[keyof typeof RoundingMode];

export function configure(dp: number, rm: RoundingMode): void {
  Big.DP = dp;
  Big.RM = rm;
}

export function add(a: string, b: string): Big {
  return new Big(a).plus(b);
}

export function divide(
  a: string,
  b: string,
  rm: RoundingMode = RoundingMode.halfUp,
): Big {
  Big.RM = rm;
  return new Big(a).div(b);
}

export function power(base: string, exponent: number): Big {
  return new Big(base).pow(exponent);
}

export function round(
  value: string,
  dp: number,
  rm: RoundingMode = RoundingMode.halfUp,
): Big {
  return new Big(value).round(dp, rm);
}

export function equals(a: string | Big, b: string | Big): boolean {
  return new Big(a).eq(b);
}

export function greaterThan(a: string | Big, b: string | Big): boolean {
  return new Big(a).gt(b);
}
