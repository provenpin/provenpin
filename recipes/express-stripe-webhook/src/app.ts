import express from "express";
import Stripe from "stripe";

export function createApp(stripe: Stripe, secret: string, onEvent: (e: Stripe.Event) => void) {
  const app = express();
  // Stripe needs the exact raw bytes, so use express.raw on this route only.
  app.post("/webhooks/stripe", express.raw({ type: "application/json" }), (req, res) => {
    const sig = req.header("stripe-signature");
    if (!sig) return res.status(400).json({ error: "missing_signature" });
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, secret);
    } catch {
      return res.status(400).json({ error: "bad_signature" });
    }
    onEvent(event);
    res.json({ received: true, type: event.type });
  });
  app.use(express.json());
  return app;
}
