import { match, P } from "ts-pattern";

export type Event =
  | { type: "user_created"; id: string; email: string }
  | { type: "user_deleted"; id: string; reason: string }
  | { type: "payment"; id: string; amount: number; currency: "USD" | "EUR" }
  | { type: "refund"; id: string; amount: number; currency: "USD" | "EUR"; paymentId: string };

export function describeEvent(e: Event): string {
  return match(e)
    .with({ type: "user_created" }, (x) => `created ${x.email}`)
    .with({ type: "user_deleted", reason: P.string.minLength(1) }, (x) => `deleted ${x.id}: ${x.reason}`)
    .with({ type: "payment", currency: "USD", amount: P.number.gt(0) }, (x) => `charge $${x.amount}`)
    .with({ type: "payment", currency: "EUR" }, (x) => `charge €${x.amount}`)
    .with({ type: "refund" }, (x) => `refund ${x.amount} ${x.currency} for ${x.paymentId}`)
    .exhaustive();
}

export function totalUsd(events: Event[]): number {
  return events.reduce((sum, e) => sum + match(e)
    .with({ type: "payment", currency: "USD" }, (x) => x.amount)
    .with({ type: "refund", currency: "USD" }, (x) => -x.amount)
    .otherwise(() => 0), 0);
}
