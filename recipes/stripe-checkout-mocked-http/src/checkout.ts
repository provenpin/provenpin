import Stripe from "stripe";

export type CartLine = { priceId: string; qty: number };

export async function createCheckout(stripe: Stripe, orderId: string, lines: CartLine[], baseUrl: string) {
  if (!lines.length) throw new Error("empty cart");
  return stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lines.map((l) => ({ price: l.priceId, quantity: l.qty })),
    success_url: `${baseUrl}/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/cart`,
    metadata: { orderId },
  }, { idempotencyKey: `checkout-${orderId}` }); // retries never create a second session
}
