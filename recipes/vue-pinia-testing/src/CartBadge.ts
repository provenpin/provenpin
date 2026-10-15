import { defineComponent, h } from "vue";
import { useCart } from "./cart";

// Render function instead of an SFC so the recipe needs no Vite Vue plugin.
export const CartBadge = defineComponent({
  setup() {
    const cart = useCart();
    return () => h("div", [
      h("span", { "data-test": "total" }, `$${cart.total}`),
      h("button", { onClick: () => cart.add("mug", 10) }, "Add mug"),
    ]);
  },
});
