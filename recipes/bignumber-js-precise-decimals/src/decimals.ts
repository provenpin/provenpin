import BigNumber from "bignumber.js";

BigNumber.config({ DECIMAL_PLACES: 20, ROUNDING_MODE: BigNumber.ROUND_HALF_UP });

export type RoundingMode =
  | "up"
  | "down"
  | "ceil"
  | "floor"
  | "half-up"
  | "half-down"
  | "half-even";

const ROUNDING: Record<RoundingMode, BigNumber.RoundingMode> = {
  up: BigNumber.ROUND_UP,
  down: BigNumber.ROUND_DOWN,
  ceil: BigNumber.ROUND_CEIL,
  floor: BigNumber.ROUND_FLOOR,
  "half-up": BigNumber.ROUND_HALF_UP,
  "half-down": BigNumber.ROUND_HALF_DOWN,
  "half-even": BigNumber.ROUND_HALF_EVEN,
};

export type Money = string | number;

export function exact(value: Money): BigNumber {
  return new BigNumber(value);
}

export function add(a: Money, b: Money): BigNumber {
  return new BigNumber(a).plus(b);
}

export function multiply(a: Money, b: Money): BigNumber {
  return new BigNumber(a).times(b);
}

export function round(value: Money, places: number, mode: RoundingMode = "half-up"): BigNumber {
  return new BigNumber(value).decimalPlaces(places, ROUNDING[mode]);
}

export function formatFixed(value: Money, places: number, mode: RoundingMode = "half-up"): string {
  return new BigNumber(value).toFixed(places, ROUNDING[mode]);
}

export function compare(a: Money, b: Money): number | null {
  return new BigNumber(a).comparedTo(b);
}

export type CartLine = {
  name: string;
  price: Money;
  qty: number;
};

export function cartTotal(lines: CartLine[], taxRate: Money = "0"): string {
  const subtotal = lines.reduce(
    (acc, line) => acc.plus(new BigNumber(line.price).times(line.qty)),
    new BigNumber(0),
  );
  const tax = subtotal.times(taxRate);
  return subtotal.plus(tax).toFixed(2, BigNumber.ROUND_HALF_UP);
}
