import { test } from "node:test";
import assert from "node:assert/strict";
import { memoize } from "proxy-memoize";
import { selectCartSummary, type State } from "../src/selectors.ts";

const makeState = (): State => ({
  user: { id: "u1", name: "Ada" },
  cart: {
    items: [
      { id: "a", qty: 2, price: 5 },
      { id: "b", qty: 1, price: 3 },
    ],
    currency: "USD",
  },
  settings: { theme: "light" },
});

test("returns the same reference when unrelated branches change", () => {
  const state = makeState();
  const first = selectCartSummary(state);

  const next: State = {
    ...state,
    user: { id: "u1", name: "Grace" },
    settings: { theme: "dark" },
  };
  const second = selectCartSummary(next);

  assert.equal(second, first);
  assert.deepEqual(second, { count: 3, total: 13, currency: "USD" });
});

test("recomputes when a selected path changes", () => {
  const state = makeState();
  const first = selectCartSummary(state);

  const next: State = {
    ...state,
    cart: {
      ...state.cart,
      items: [...state.cart.items, { id: "c", qty: 4, price: 2 }],
    },
  };
  const second = selectCartSummary(next);

  assert.notEqual(second, first);
  assert.deepEqual(second, { count: 7, total: 21, currency: "USD" });
  assert.deepEqual(first, { count: 3, total: 13, currency: "USD" });
});

test("size option retains multiple cached entries", () => {
  const stateA = makeState();
  const stateB: State = {
    ...stateA,
    cart: { ...stateA.cart, currency: "EUR" },
  };

  const select = memoize(
    (state: State) => ({
      count: state.cart.items.length,
      currency: state.cart.currency,
    }),
    { size: 2 },
  );

  const a1 = select(stateA);
  const b1 = select(stateB);
  const a2 = select(stateA);

  assert.notEqual(a1, b1);
  assert.equal(a2, a1);
});
