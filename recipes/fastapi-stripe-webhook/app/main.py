import os
import stripe
from fastapi import FastAPI, Header, HTTPException, Request

app = FastAPI()
WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "whsec_test")
handled: list[str] = []

@app.post("/webhooks/stripe")
async def stripe_webhook(request: Request, stripe_signature: str | None = Header(default=None)):
    if not stripe_signature:
        raise HTTPException(400, "missing signature")
    payload = await request.body()  # raw bytes, never re-serialized JSON
    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, WEBHOOK_SECRET)
    except (ValueError, stripe.SignatureVerificationError):
        raise HTTPException(400, "bad signature")
    if event["type"] == "checkout.session.completed":
        handled.append(event["data"]["object"]["id"])
    return {"received": True, "type": event["type"]}
