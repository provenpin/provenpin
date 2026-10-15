/** @jsxImportSource preact */
import { signal, computed } from "@preact/signals";
import { useState } from "preact/hooks";

export type Item = { sku: string; name: string; priceCents: number; qty: number };

/** Store as module-level signals; createCart() gives tests a fresh instance. */
export function createCart() {
  const items = signal<Item[]>([]);
  const count = computed(() => items.value.reduce((n, i) => n + i.qty, 0));
  const totalCents = computed(() => items.value.reduce((s, i) => s + i.qty * i.priceCents, 0));
  return {
    items, count, totalCents,
    add(item: Omit<Item, "qty">) {
      const existing = items.value.find((i) => i.sku === item.sku);
      items.value = existing
        ? items.value.map((i) => (i.sku === item.sku ? { ...i, qty: i.qty + 1 } : i))
        : [...items.value, { ...item, qty: 1 }];
    },
    remove(sku: string) { items.value = items.value.filter((i) => i.sku !== sku); },
  };
}
export type Cart = ReturnType<typeof createCart>;

const money = (c: number) => `$${(c / 100).toFixed(2)}`;

export function CartBadge({ cart }: { cart: Cart }) {
  // Reading .value inside render subscribes this component to the signal.
  return <span aria-label="cart count">{cart.count.value}</span>;
}

export function CartView({ cart }: { cart: Cart }) {
  if (cart.items.value.length === 0) return <p>Your cart is empty</p>;
  return (
    <section>
      <ul>
        {cart.items.value.map((i) => (
          <li key={i.sku}>
            {i.name} x{i.qty} <button onClick={() => cart.remove(i.sku)} aria-label={`remove ${i.name}`}>Remove</button>
          </li>
        ))}
      </ul>
      <p>Total: <strong data-testid="total">{money(cart.totalCents.value)}</strong></p>
    </section>
  );
}

export function CouponForm({ onApply }: { onApply: (code: string) => Promise<boolean> }) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "bad">("idle");
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      setStatus("checking");
      setStatus((await onApply(code.trim().toUpperCase())) ? "ok" : "bad");
    }}>
      <label>Coupon <input value={code} onInput={(e) => setCode(e.currentTarget.value)} /></label>
      <button type="submit" disabled={!code.trim() || status === "checking"}>Apply</button>
      {status === "ok" && <p role="status">Coupon applied</p>}
      {status === "bad" && <p role="alert">Invalid coupon</p>}
    </form>
  );
}
