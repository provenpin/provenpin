import jsonLogic, { type RulesLogic } from "json-logic-js";

jsonLogic.add_operation("volume_discount", (quantity: number, unitPrice: number) => {
  const subtotal = quantity * unitPrice;
  if (quantity >= 100) return (subtotal * 4) / 5;
  if (quantity >= 10) return (subtotal * 9) / 10;
  return subtotal;
});

export const rules: Record<string, RulesLogic> = {
  freeShipping: {
    and: [
      { ">=": [{ var: "total" }, 100] },
      { "==": [{ var: "country" }, "US"] },
    ],
  },
  needsReview: {
    or: [
      { ">=": [{ var: "total" }, 1000] },
      { in: [{ var: "country" }, ["IR", "KP"]] },
    ],
  },
  customerAge: { var: ["customer.age", 0] },
  isGiftOrder: { in: ["gift", { var: ["items", []] }] },
  shipping: {
    if: [
      { var: ["isDigital", false] },
      "digital-delivery",
      { ">=": [{ var: "total" }, 100] },
      "free-shipping",
      "paid-shipping",
    ],
  },
};

export const volumeDiscountRule = {
  volume_discount: [{ var: "quantity" }, { var: "unitPrice" }],
};

export function evaluate(rule: unknown, data: Record<string, unknown>): unknown {
  return jsonLogic.apply(rule as RulesLogic, data);
}
