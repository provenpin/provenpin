import {
  array, assert, coerce, create, defaulted, enums, integer, is, min, object, optional,
  refine, size, string, number, trimmed, StructError, type Infer,
} from "superstruct";

const Email = refine(trimmed(string()), "email", (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || `"${v}" is not an email`);
const IntFromString = coerce(integer(), string(), (v) => Number.parseInt(v, 10));
const NumFromString = coerce(number(), string(), (v) => Number(v));

export const LineItem = object({
  sku: size(string(), 3, 20),
  qty: min(IntFromString, 1),
  price: min(NumFromString, 0),
});

export const Order = object({
  email: Email,
  shipping: defaulted(enums(["standard", "express"]), "standard"),
  coupon: optional(string()),
  items: size(array(LineItem), 1, 50),
});

export type Order = Infer<typeof Order>;

export function parseOrder(input: unknown): Order {
  return create(input, Order);
}

export function orderTotal(order: Order): number {
  return Math.round(order.items.reduce((s, i) => s + i.qty * i.price, 0) * 100) / 100;
}

export function explain(input: unknown): string[] {
  try {
    create(input, Order);
    return [];
  } catch (e) {
    if (!(e instanceof StructError)) throw e;
    return e.failures().map((f) => `${f.path.join(".")}: ${f.refinement ?? f.type}`);
  }
}

export { assert, is };
