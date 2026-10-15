import { Effect, Schedule, Schema } from "effect";

/** Wire format: JSON with string numbers, as many legacy APIs send them. */
export class LineItem extends Schema.Class<LineItem>("LineItem")({
  sku: Schema.String.check(Schema.isPattern(/^[A-Z]{3}-\d{3}$/)),
  qty: Schema.Int.check(Schema.isGreaterThan(0)),
  // FiniteFromString rejects "x"; NumberFromString would decode it to NaN
  unitCents: Schema.FiniteFromString,
}) {
  get totalCents() { return this.qty * this.unitCents; }
}

export class Order extends Schema.Class<Order>("Order")({
  id: Schema.String.pipe(Schema.brand("OrderId")),
  customer: Schema.Trim.check(Schema.isMinLength(1)),
  status: Schema.Literals(["pending", "paid", "shipped"]),
  items: Schema.Array(LineItem).check(Schema.isMinLength(1)),
  note: Schema.optionalKey(Schema.String),
}) {
  get totalCents() { return this.items.reduce((s, i) => s + i.totalCents, 0); }
}

/** Decodes a raw JSON string straight into an Order instance. */
export const OrderFromJson = Schema.fromJsonString(Order);

export class InvalidOrder extends Schema.TaggedError<InvalidOrder>()("InvalidOrder", { message: Schema.String }) {}
export class UpstreamUnavailable extends Schema.TaggedError<UpstreamUnavailable>()("UpstreamUnavailable", { attempt: Schema.Number }) {}

export const parseOrder = (json: string) =>
  // errors: "all" collects every issue instead of stopping at the first one
  Schema.decodeUnknownEffect(OrderFromJson)(json, { errors: "all" }).pipe(Effect.mapError((e) => new InvalidOrder({ message: e.message })));

export const encodeOrder = (o: Order) => Schema.encodeEffect(OrderFromJson)(o);

/**
 * Fetches an order through a flaky upstream, retrying UpstreamUnavailable with exponential
 * backoff (100ms, 200ms, ...) up to 3 retries. InvalidOrder is never retried.
 */
export const fetchOrder = (fetchRaw: (attempt: number) => Effect.Effect<string, UpstreamUnavailable>) => {
  let attempt = 0;
  return Effect.suspend(() => fetchRaw(++attempt)).pipe(
    Effect.retry({ schedule: Schedule.exponential("100 millis"), times: 3 }),
    Effect.flatMap(parseOrder),
  );
};
