import currency from "currency.js";

export type Money = ReturnType<typeof currency>;
export type MoneyOptions = NonNullable<Parameters<typeof currency>[1]>;

export function money(value: string | number, options?: MoneyOptions): Money {
  return currency(value, options);
}

export function add(a: string | number, b: string | number): Money {
  return currency(a).add(b);
}

export function subtract(a: string | number, b: string | number): Money {
  return currency(a).subtract(b);
}

export function multiply(a: string | number, factor: number): Money {
  return currency(a).multiply(factor);
}

export function distribute(total: string | number, parts: number): number[] {
  return currency(total)
    .distribute(parts)
    .map((part) => part.value);
}

export function format(amount: string | number, options?: MoneyOptions): string {
  return currency(amount, options).format();
}
