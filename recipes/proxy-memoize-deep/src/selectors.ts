import { memoize } from "proxy-memoize";

export type CartItem = {
  id: string;
  qty: number;
  price: number;
};

export type State = {
  user: { id: string; name: string };
  cart: { items: CartItem[]; currency: string };
  settings: { theme: "light" | "dark" };
};

export type CartSummary = {
  count: number;
  total: number;
  currency: string;
};

export const selectCartSummary = memoize(
  (state: State): CartSummary => {
    let count = 0;
    let total = 0;
    for (const item of state.cart.items) {
      count += item.qty;
      total += item.qty * item.price;
    }
    return { count, total, currency: state.cart.currency };
  },
  { size: 2 },
);
