from fastapi.testclient import TestClient
from app.main import app, OrderIn

client = TestClient(app)
card = {"kind": "card", "number": "4242424242424242"}

def test_valid_order_with_computed_total():
    r = client.post("/orders", json={"email": " ADA@Example.com ", "quantity": 3, "unit_price": 9.99, "payment": card})
    assert r.status_code == 201
    assert r.json() == {"email": "ada@example.com", "quantity": 3, "unit_price": 9.99, "payment_kind": "card", "total": 29.97}

def test_discriminated_union_error_points_at_right_branch():
    r = client.post("/orders", json={"email": "a@b.c", "quantity": 1, "unit_price": 1, "payment": {"kind": "card", "number": "1"}})
    assert r.status_code == 422
    assert r.json()["detail"][0]["loc"][-2:] == ["card", "number"]

def test_model_validator_and_extra_forbid():
    r = client.post("/orders", json={"email": "a@b.c", "quantity": 60, "unit_price": 1, "payment": card})
    assert r.status_code == 422 and "bank transfer" in r.text
    r = client.post("/orders", json={"email": "a@b.c", "quantity": 1, "unit_price": 1, "payment": card, "coupon": "x"})
    assert r.status_code == 422

def test_model_validate_json_directly():
    o = OrderIn.model_validate_json('{"email":"x@y.z","quantity":1,"unit_price":2,"payment":{"kind":"bank","iban":"DE00"}}')
    assert o.payment.kind == "bank"
