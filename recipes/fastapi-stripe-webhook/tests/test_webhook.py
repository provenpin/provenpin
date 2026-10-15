import hashlib, hmac, json, time
from fastapi.testclient import TestClient
from app.main import app, handled, WEBHOOK_SECRET

client = TestClient(app)
PAYLOAD = json.dumps({"id": "evt_1", "object": "event", "type": "checkout.session.completed", "data": {"object": {"id": "cs_1"}}})

def sign(payload: str, secret: str) -> str:
    ts = int(time.time())
    sig = hmac.new(secret.encode(), f"{ts}.{payload}".encode(), hashlib.sha256).hexdigest()
    return f"t={ts},v1={sig}"

def test_valid_signature():
    r = client.post("/webhooks/stripe", content=PAYLOAD, headers={"stripe-signature": sign(PAYLOAD, WEBHOOK_SECRET), "content-type": "application/json"})
    assert r.status_code == 200 and r.json()["type"] == "checkout.session.completed"
    assert "cs_1" in handled

def test_bad_signature():
    r = client.post("/webhooks/stripe", content=PAYLOAD, headers={"stripe-signature": sign(PAYLOAD, "whsec_wrong")})
    assert r.status_code == 400

def test_missing_signature():
    assert client.post("/webhooks/stripe", content=PAYLOAD).status_code == 400
